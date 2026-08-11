import { deleteHandler, getHandler, postHandler, PrecheckFunction } from "@lib/backend/helpers/handlers";
import { sendNotification } from "@lib/backend/actions/notification";
import { likeSchema } from "@lib/shared/validation/schemas";
import { isMilestoneReached } from "@lib/backend/utils";
import { Comment, Connection, Like, User } from "@model";
import { LikeSchemaType } from "@type/schemas";

// Checking if the current user has been blocked by the author of the comment.
const preCheck: PrecheckFunction<LikeSchemaType> = async ({ user_id, data }) => {
  const { comment_author } = data;

  const isBlocked = await Connection.exists({
    follower: user_id,
    followee: comment_author,
    blocked: true,
  });

  if (isBlocked) return { success: false, errCode: "blocked_by_author" };

  return { success: true };
};

// Liking a comment
export const POST = postHandler<LikeSchemaType>({
  handler: async ({ user_id, params, session }) => {
    const { id } = params;

    await Like.create([{ user_id, comment_id: id }], { session });

    const comment = await Comment.findByIdAndUpdate(
      id,
      {
        $inc: { likes_count: 1 },
      },
      { session, new: true }
    );

    if (!comment)
      return { success: false, errCode: "resource_not_found" }

    await User.findByIdAndUpdate(comment.user_id, { $inc: { likes: 1 } }, { session });

    if (!comment) return { success: false, errCode: "resource_not_found" };
    const milestoneTouched = isMilestoneReached(comment.likes_count);

    if (milestoneTouched) {
      await sendNotification(
        [comment.user_id],
        {
          title: `Congratulations! Your comment has got ${comment.likes_count} likes 🙌🥳`,
          poster: undefined,
          message: [
            {
              type: "link",
              label: "Your comment",
              path: `/c/${comment._id}`,
            },
            {
              type: "text",
              text: `has reached a new milestone. It got ${comment.likes_count} likes 🙌🥳`,
            },
          ],
          path: `/c/${comment._id}`,
        },
        session
      );
    }

    return {
      result: true,
      success: true,
      available: "likesMutation_cid_uid_author",
      options: {
        cid: id,
        uid: user_id,
        author: milestoneTouched ? comment.user_id : "",
      },
    };
  },
  schema: likeSchema,
  preCheck,
});

// Check if the current user has Liked a comment or not
export const GET = getHandler(async (_, params) => {
  const { id, cuid } = params;

  const like = await Like.exists({ comment_id: id, user_id: cuid });

  return { result: Boolean(like), success: true };
}
);

// Delete the Like of the current user on a comment
export const DELETE = deleteHandler(async ({ user_id, params, session }) => {
  const { id } = params;

  const doc = await Like.findOneAndDelete({ comment_id: id, user_id }, { session });
  const comment = await Comment.findByIdAndUpdate(
    id,
    {
      $inc: { likes_count: -1 },
    },
    { session }
  );

  if (!doc || !comment) return { success: false, errCode: "resource_not_found" };

  await User.findByIdAndUpdate(comment.user_id, { $inc: { likes: -1 } }, { session })

  return {
    success: true,
    result: null,
    available: "likesMutation_cid_uid_author",
    options: { cid: id, uid: user_id, author: "" },
    files: [],
  };
});
