import { sendNotification } from "@lib/backend/actions/notification";
import { postHandler, PrecheckFunction } from "@lib/backend/helpers/handlers";
import { convertMatchToLookupExpr, getFollowersToNotify, getMembersToNotify } from "@lib/backend/helpers/pipelines";
import { parloculaAppURL } from "@lib/shared/constants";
import { createArray } from "@lib/shared/utils";
import { postSchemaServer } from "@lib/shared/validation/schemas";
import { Post, Thread, User } from "@model";
import type { PipelineStage } from "@type/mongoose";
import { PostSchemaType } from "@type/schemas";

// Checking if the current user is a member of the thread and if user is blocked by the author of the quoted post.
const preCheck: PrecheckFunction<PostSchemaType> = async ({ user_id, data }) => {
  const { thread_id, quoted_post_id, quoted_post_author } = data;

  if (!thread_id || (quoted_post_id && !quoted_post_author))
    return { success: false, errCode: "invalid_input" };

  const pipeline = createArray<PipelineStage>([
    { $match: { _id: user_id } },
    {
      $lookup: {
        from: "members",
        let: { id: "$_id" },
        pipeline: [
          convertMatchToLookupExpr({
            user_id: "$$id",
            thread_id: thread_id,
            banned: false
          }),
          { $project: { _id: 1 } }
        ],
        as: "isMember",
      },
    },
  ]).concatConditionally(quoted_post_author, (author) => ({
    $lookup: {
      from: "connections",
      as: "isBlocked",
      let: { id: "$_id" },
      pipeline: [
        convertMatchToLookupExpr({
          follower: "$$id",
          followee: author,
          blocked: true
        }),
        { $project: { _id: 1 } }
      ],
    },
  })).concat({ $project: { isMember: 1, isBlocked: 1 } });

  const checks = await User.aggregate(pipeline);

  const check = checks[0];

  if (!check.isMember || !check.isMember.length)
    return { success: false, errCode: "not_a_member" };
  else if (quoted_post_id && check.isBlocked.length)
    return { success: false, errCode: "blocked_by_author" };
  return { success: true };
};

// Posting in a thread.
export const POST = postHandler<PostSchemaType>({
  handler: async ({ data, frames, user_id, username, session, profile, isNsfw }) => {

    const { quoted_post_author, quoted_post_id, ...rest } = data;

    const post = (
      await Post.create([
        {
          ...rest,
          frames,
          frames_count: frames.length,
          links_count: rest.links.length,
          user_id,
          quoted_post_id
        }
      ], { session, ordered: true })
    )[0];

    if (!post)
      return { success: false, errCode: "data_storing_fail" }

    else if (post.quoted_post_id) {
      await Post.findByIdAndUpdate(post.quoted_post_id, {
        $inc: { quoted_count: 1 }
      }, { session });
    }

    const thread = await Thread.findByIdAndUpdate(
      post.thread_id,
      {
        $inc: { post_count: 1 },
        $set: { lastPostedAt: new Date() },
      },
      { session }
    );

    if (!thread)
      return { success: false, errCode: "resource_not_found" };

    const user = await User.findByIdAndUpdate(user_id, {
      $inc: { posts: 1 },
      $set: { lastPostedAt: new Date() },
    }, { session });

    if (!user)
      return { success: false, errCode: "unauthenticated_access" }

    const tid = thread._id!;

    const followers = await getFollowersToNotify(user_id);
    const members = await getMembersToNotify(tid, 50, user_id);

    await sendNotification(
      Array.from(
        new Set(
          followers
            .map(({ follower }) => follower)
            .concat(members.map(({ user_id }) => user_id))
        )
      ),
      {
        title: `${username} has created a new post in ${thread.name}`,
        path: `/p/${post._id}`,
        poster: profile,
        message: [
          { type: "link", label: username, path: `/u/${username}` },
          { type: "text", text: "has created a new post in thread" },
          {
            type: "link",
            label: `${thread.name}.`,
            path: `/t/${post.thread_id}`,
          },
          { type: "text", text: "Be the first one to" },
          {
            type: "link",
            label: "check it out.",
            path: `/p/${post._id}`,
          },
        ],
      },
      session
    );

    return {
      result: post,
      success: true,
      available: "postMutation_pid_tid_uid",
      options: { pid: post._id, tid, uid: user_id },
      warnTeamParlocula: rest.nsfw || !isNsfw ? undefined : {
        title: "Possibly NSFW Post with incorrect flags",
        desc: "This Post may contain NSFW Frames while nsfw is set to false.",
        path: `${parloculaAppURL}/p/${post._id}`
      }
    };
  },
  schema: postSchemaServer,
  preCheck,
});
