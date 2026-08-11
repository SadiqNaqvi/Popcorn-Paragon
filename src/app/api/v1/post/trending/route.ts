import { getHandler } from "@lib/backend/helpers/handlers";
import { postsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getPageParams } from "@lib/backend/utils";
import { Post } from "@model";

export const GET = getHandler(async (r) => {

    const page = getPageParams(r) - 1;
    const nsfw = Boolean(r.nextUrl.searchParams.get("nsfw") === "true");
    const now = Date.now();

    const response = await Post.aggregate(
        postsAggregationPipeline({
            filters: [
                ...(nsfw ? [] : [{ $match: { nsfw: false } }]),
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
            excludeQuotedPost: false,
            isLinkBased: false,
            page,
            sort: {
                score: -1,
                createdAt: -1,
            }
        })
    )

    const result = response[0];

    return { success: true, result }

})