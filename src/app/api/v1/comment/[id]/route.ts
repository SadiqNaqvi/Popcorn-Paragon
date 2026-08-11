import { getHandler } from "@lib/backend/helpers/handlers";
import { Comment } from "@model";

// Get comment details by id
export const GET = getHandler(async (r, params) => {
  const { id } = params;

  const response = await Comment.aggregate([
    {
      $match: { _id: id },
    },
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
        from: "posts",
        localField: "post_id",
        foreignField: "_id",
        pipeline: [{ $project: { user_id: 1, thread_id: 1 } }],
        as: "post",
      },
    },
    {
      $addFields: {
        username: { $arrayElemAt: ["$user.username", 0] },
        profile: { $arrayElemAt: ["$user.profile", 0] },
        post_author: { $arrayElemAt: ["$post.user_id", 0] },
        thread_id: { $arrayElemAt: ["$post.thread_id", 0] },
      },
    },
    { $project: { user: 0, post: 0 } },
  ]);

  return { result: response[0], success: true };
});
