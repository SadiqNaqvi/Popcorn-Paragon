import { getHandler } from "@lib/backend/helpers/handlers";
import { Post } from "@model";

// Get full post by id
export const GET = getHandler(async (r, params) => {
  const { id } = params;

  const response = await Post.aggregate([
    { $match: { _id: id } },
    {
      $lookup: {
        from: "threads",
        localField: "thread_id",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1 } }],
        as: "thread",
      },
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
        localField: "quoted_post_id",
        foreignField: "_id",
        pipeline: [{ $project: { title: 1, frames_count: 1, links_count: 1 } }],
        as: "quoted_post",
      },
    },
    {
      $addFields: {
        username: { $ifNull: [{ $arrayElemAt: ["$user.username", 0] }, ""] },
        thread_name: { $ifNull: [{ $arrayElemAt: ["$thread.name", 0] }, ""] },
        poster: { $ifNull: [{ $arrayElemAt: ["$user.profile", 0] }, ""] },
        quoted_post_title: { $ifNull: [{ $arrayElemAt: ["$quoted_post.title", 0] }, ""] },
        quoted_post_frames_count: { $ifNull: [{ $arrayElemAt: ["$quoted_post.frames_count", 0] }, 0] },
        quoted_post_links_count: { $ifNull: [{ $arrayElemAt: ["$quoted_post.links_count", 0] }, 0] }
      },
    },
    {
      $project: {
        user: 0,
        thread: 0,
        quoted_post: 0,
      },
    },
  ]);

  return { result: response[0], success: true };
});
