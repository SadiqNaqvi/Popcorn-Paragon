import { deleteHandler, updateHandler } from "@lib/backend/helpers/handlers";;
import { deleteComments } from "@lib/backend/helpers/deletion";
import { commentSchemaUpdate } from "@lib/shared/validation/schemas";
import { Comment, Post, Thread, User } from "@model";
import { CommentSchemaUpdateType } from "@type/schemas";

// Delete A Comment
export const DELETE = deleteHandler(
  async ({ params, session, user_id }) => {
    const { id } = params;

    const result = await deleteComments({ _id: id, user_id }, session, ["post_id", "replied_to"]);
    const comment = result[0];

    const post = await Post.findByIdAndUpdate(
      comment.post_id,
      {
        $inc: { comment_count: -1 },
      },
      { session, order: true }
    );

    if (!post) return {
      success: false, errCode: "resource_not_found"
    }

    if (comment.replied_to) {
      await Comment.findByIdAndUpdate(comment.replied_to, { $inc: { replies_count: -1 } }, { session })
    }

    await Thread.findByIdAndUpdate(
      post.thread_id,
      {
        $inc: { comment_count: -1 }
      },
      { session, order: true }
    );

    await User.findByIdAndUpdate(
      user_id,
      { $inc: { comments: -1 } },
      { session, order: true }
    )

    return {
      success: true,
      files: [],
      available: "commentMutation_cid_uid_pid",
      options: { cid: id, pid: comment.post_id, uid: user_id },
    };
  }
);

// Update a comment
export const PATCH = updateHandler<CommentSchemaUpdateType>({
  handler: async ({ data, params, session, user_id, username }) => {
    const { id } = params;

    const comment = await Comment.findOneAndUpdate(
      { _id: id, user_id },
      { $set: { ...data, edited_at: new Date() } },
      { session }
    );

    if (!comment)
      return { success: false, errCode: "resource_not_found" };

    return {
      success: true,
      result: null,
      available: "commentUpdation_cid",
      options: { cid: id, username, pid: comment.post_id.toString() },
    };
  },
  schema: commentSchemaUpdate,
});