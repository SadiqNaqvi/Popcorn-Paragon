import { getHandler } from "@lib/backend/helpers/handlers";
import { attachNsfwInPipeline, createPipeline, postsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getUpstashRedis } from "@lib/backend/providers/redis";
import { zaddInUpstash } from "@lib/backend/redis/utils";
import { getPageParams } from "@lib/backend/utils";
import { oneHourInSeconds, queryLimit } from "@lib/shared/constants";
import { createArray } from "@lib/shared/utils";
import { Connection, Member, Post } from "@model";
import { AggregatedResponse, MerePost } from "@type/internal";

const getFollowedThreadIds = async (userId: string) => {

    const redis = await getUpstashRedis();
    const key = `followed:${userId}:thread`;
    const threadIds = redis.smembers(key);
    if (threadIds) return threadIds;

    const memberships = await Member
        .find({ user_id: userId, banned: { $ne: true } })
        .projection({ thread_id: 1 })
        .toArray();

    const ids = memberships.map((m: { thread_id: string }) => m.thread_id);
    await zaddInUpstash(key, ids, undefined, { nx: true });
    return ids;
}

const getFollowedUserIds = async (userId: string) => {
    const redis = await getUpstashRedis();
    const key = `followed:${userId}:users`;
    const userIds = redis.smembers(key);
    if (userIds) return userIds;

    const connections = await Connection
        .find({ follower: userId, blocked: false })
        .projection({ followee: 1 })
        .toArray();

    const ids = connections.map((c: { followee: string }) => c.followee);
    await zaddInUpstash(key, ids, undefined, { nx: true });
    return ids;
}

const getViewedPostIds = async (uid: string) => {
    const redis = await getUpstashRedis();
    return await redis.zrange(`feed:${uid}:viewed`, 0, -1);
}

const getPostsFromDatabase = async (cuid: string, page: number, nsfw: boolean) => {
    const viewedIds = await getViewedPostIds(cuid);
    const followedThreadIds = await getFollowedThreadIds(cuid);
    const followedUserIds = await getFollowedUserIds(cuid);

    const now = Date.now();

    const response = await Post.aggregate<AggregatedResponse<MerePost & { score: 1 }>>(
        createPipeline({
            filters: [
                {
                    $match: {
                        $and: [
                            { _id: { $nin: viewedIds } },
                            {
                                $or: [
                                    { thread_id: { $in: followedThreadIds } },
                                    { user_id: { $in: followedUserIds } },
                                ],
                            },
                            ...(nsfw ? [] : [{ nsfw: false }])
                        ],
                    },
                },
                {
                    $addFields: {
                        score: {
                            $add: [
                                { $multiply: ["$reaction_count", 2] },
                                { $multiply: ["$comment_count", 3] },
                                {
                                    $max: [
                                        0,
                                        {
                                            $subtract: [
                                                86400000,
                                                { $subtract: [now, { $toLong: "$createdAt" }] },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                }
            ],
            sort: { score: -1 },
            page,
            preProjection: [
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        pipeline: [{ $project: { username: 1, profile: 1 } }],
                        as: "user",
                    },
                },
                {
                    $lookup: {
                        from: "threads",
                        localField: "thread_id",
                        foreignField: "_id",
                        as: "thread",
                        pipeline: [{ $project: { name: 1, poster: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: "posts",
                        localField: "quoted_post_id",
                        foreignField: "_id",
                        pipeline: [{ $project: { title: 1, frames_count: 1, links_count: 1 } }],
                        as: "quoted_post",
                    },
                },
                {
                    $addFields: {
                        thread_name: { $arrayElemAt: ["$thread.name", 0] },
                        username: { $arrayElemAt: ["$user.username", 0] },
                        profile: { $arrayElemAt: ["$user.profile", 0] },
                        poster: { $arrayElemAt: ["$thread.poster", 0] },
                        quoted_post_title: { $ifNull: [{ $arrayElemAt: ["$quoted_post.title", 0] }, ""] },
                        quoted_post_frames_count: { $ifNull: [{ $arrayElemAt: ["$quoted_post.frames_count", 0] }, 0] },
                        quoted_post_links_count: { $ifNull: [{ $arrayElemAt: ["$quoted_post.links_count", 0] }, 0] }
                    },
                },
            ],
            projection: {
                user: 0,
                thread: 0,
                user_id: 0,
                body: 0,
                links: 0,
            },
        })
    );

    return response[0] ?? { data: [], total: 0 };
}

const getPostsFromRedis = async (cuid: string, page: number, nsfw: boolean) => {
    const redis = await getUpstashRedis();
    const start = page * queryLimit;
    const stop = start + queryLimit - 1;

    const postFeed = await redis.zrange(`feed:${cuid}`, start, stop, { rev: true });

    const response = await Post.aggregate<AggregatedResponse<MerePost>>(
        postsAggregationPipeline({
            filters: [{
                $match: attachNsfwInPipeline({ _id: { $in: postFeed } }, nsfw)
            }],
            page,
            excludeQuotedPost: false,
            isLinkBased: false,
        })
    )

    return response[0] ?? { data: [], total: 0 };
}

const storePostsInRedis = async (cuid: string, posts: { score: number, _id: string, [key: string]: any }[]) => {

    if (!posts.length) return;

    const pipeline = (await getUpstashRedis()).multi();
    const key = `feed:${cuid}`;

    zaddInUpstash(key, posts.flatMap(({ score, _id }) => ({ score, member: _id })), pipeline, { nx: true });
    pipeline.zremrangebyrank(key, 0, -(queryLimit * 5));
    pipeline.expire(key, oneHourInSeconds);

    await pipeline.exec();
}

const prefetchNextPage = async (cuid: string, nsfw: boolean) => {

    const viewedIds = await getViewedPostIds(cuid);
    const followedThreadIds = await getFollowedThreadIds(cuid);
    const followedUserIds = await getFollowedUserIds(cuid);

    const now = Date.now();

    const posts = await Post.aggregate<{ _id: string, score: number }>([
        {
            $match: {
                $and: [
                    { _id: { $nin: viewedIds } },
                    {
                        $or: [
                            { thread_id: { $in: followedThreadIds } },
                            { user_id: { $in: followedUserIds } },
                        ],
                    },
                    ...(nsfw ? [] : [{ nsfw: false }]),
                ],
            },
        },
        {
            $addFields: {
                score: {
                    $add: [
                        { $multiply: ["$reaction_count", 2] },
                        { $multiply: ["$comment_count", 3] },
                        {
                            $max: [
                                0,
                                {
                                    $subtract: [
                                        86400000,
                                        { $subtract: [now, { $toLong: "$createdAt" }] },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        },
        { $sort: { score: -1 } },
        { $limit: queryLimit * 2 },
        { $project: { _id: 1, score: 1 } },
    ]);

    await storePostsInRedis(cuid, posts);

}

export const GET = getHandler(async (r, { cuid }) => {

    const page = getPageParams(r) - 1;
    const nsfw = Boolean(r.nextUrl.searchParams.get("nsfw") === "true");
    const redis = await getUpstashRedis();

    const postIdsInRedisCount = await redis.zcount(`feed:${cuid}`, "-inf", "+inf");

    if (postIdsInRedisCount && postIdsInRedisCount > (queryLimit * page)) {
        const [result] = await Promise.all(
            createArray<any>(
                getPostsFromRedis(cuid, page, nsfw)
            ).concatConditionally(
                postIdsInRedisCount < queryLimit,
                () => prefetchNextPage(cuid, nsfw)
            )
        );

        return { success: true, result }

    } else {
        const result = await getPostsFromDatabase(cuid, page, nsfw);

        await storePostsInRedis(cuid, result.data);
        return { success: true, result }
    }

});