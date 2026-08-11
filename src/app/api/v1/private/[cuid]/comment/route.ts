import { sendNotification } from "@lib/backend/actions/notification";
import { postHandler, type PrecheckFunction } from "@lib/backend/helpers/handlers";
import { createArray } from "@lib/shared/utils";
import { commentSchema } from "@lib/shared/validation/schemas";
import { Comment, Connection, Post, Thread, User } from "@model";
import { CommentSchemaType } from "@type/schemas";

// Checking if the author of the post or the author of the replied comment has blocked the current user or not.

const preCheck: PrecheckFunction<CommentSchemaType> = async ({ data, user_id }) => {

  if ((data.comment_author ? data.comment_author === user_id : true) && data.post_author === user_id)
    return { success: true };

  const checks = await Connection.aggregate([
    {
      $facet: {
        ...(data.post_author !== user_id && {
          authorOfPost: [
            {
              $match: {
                followee: data.post_author,
                follower: user_id,
                blocked: true,
              },
            },
            { $project: { _id: 1 } },
          ]
        }),
        ...(data.comment_author && data.comment_author !== user_id && {
          authorOfRepliedComment: [
            {
              $match: {
                followee: data.comment_author,
                follower: user_id,
                blocked: true,
              },
            },
            { $project: { _id: 1 } },
          ],
        }),
      },
    },
  ]);

  const { authorOfRepliedComment, authorOfPost } = checks[0] || {};

  const isBlocked = Boolean(authorOfPost?.length || authorOfRepliedComment?.length);

  if (isBlocked)
    return { success: false, errCode: "blocked_by_author" };

  return { success: true };
}

// Posting a comment
export const POST = postHandler<CommentSchemaType>({
  handler: async ({ data, username, session, user_id, profile }) => {
    const { post_author, comment_author, ...rest } = data;

    const comment = (await Comment.create([{ ...rest, user_id }], { session }))[0];

    const post = await Post.findByIdAndUpdate(
      data.post_id,
      {
        $inc: { comment_count: 1 },
      },
      { session }
    );

    if (!post)
      return { success: false, errCode: "resource_not_found" };

    await Thread.findByIdAndUpdate(
      post.thread_id,
      {
        $set: { lastCommentedAt: new Date() },
        $inc: { comment_count: 1 }
      },
      { session }
    );

    await User.findByIdAndUpdate(user_id, {
      $set: { lastCommentedAt: new Date() },
      $inc: { comments: 1 }
    }, { session });

    if (rest.replied_to) {
      await Comment.findByIdAndUpdate(rest.replied_to, { $inc: { replies_count: 1 } }, { session })
    }

    await Promise.all(
      createArray([] as Promise<void>[])
        .concatConditionally(post_author !== user_id,
          () => sendNotification([post_author], {
            message: [
              { type: "link", label: username, path: `/u/${username}` },
              { type: "text", text: "commented on your post" },
              {
                type: "link",
                label: `${post.title.slice(0, 40).concat(post.title.length > 40 ? "..." : ".")}`,
                path: `/p/${rest.post_id}?f=latest`,
              },
              {
                type: "link",
                label: "Open Comment.",
                path: `/c/${comment._id}`,
              },
            ],
            title: `${username} commented on your post.`,
            poster: profile,
            path: `/p/${rest.post_id}?f=latest`,
            metadata: {
              post_id: rest.post_id,
              comment_id: comment._id,
            },
          }, session)
        ).concatConditionally(comment_author && comment_author !== user_id, () =>
          sendNotification([comment_author||''], {
            message: [
              { type: "link", label: username, path: `/u/${username}` },
              { type: "text", text: "replied to your" },
              {
                type: "link",
                label: "comment.",
                path: `/c/${rest.replied_to}?f=latest`,
              },
            ],
            title: `${username} replied to your comment.`,
            poster: profile,
            path: `/c/${rest.replied_to}?f=latest`,
            metadata: {
              post_id: rest.post_id,
              comment_id: comment._id,
            },
          }, session)
        ))

    return {
      success: true,
      result: comment,
      revalidateQueue: createArray([
        `comments-user-${username}`,
        `comments-post-${data.post_id}`,
        `notifications-user-${post_author}`,
      ]).concatConditionally(comment_author, (uid) => [
        `notifications-user-${uid}`,
      ]).concatConditionally(comment.replied_to, (parent) => [
        `replies-comment-${parent}`
      ])
    };
  },
  schema: commentSchema,
  preCheck
});