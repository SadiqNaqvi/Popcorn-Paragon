import { getHandler } from "@lib/backend/helpers/handlers";
import { convertMatchToLookupExpr } from "@lib/backend/helpers/pipelines";
import { Thread } from "@model";

// Get the details of the thread by thread id;
export const GET = getHandler(async (r, params) => {
  const { id } = params;

  const results = await Thread.aggregate([
    { $match: { _id: id } },
    {
      $lookup: {
        from: "users",
        localField: "created_by",
        foreignField: "_id",
        pipeline: [{ $project: { username: 1 } }],
        as: "user",
      },
    },
    {
      $lookup: {
        from: "members",
        pipeline: [
          convertMatchToLookupExpr({
            thread_id: id,
            role: "moderator"
          }),
          { $project: { user_id: 1 } }
        ],
        as: "moderators",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "moderators.user_id",
        foreignField: "_id",
        pipeline: [{ $project: { username: 1, _id: 1 } }],
        as: "managers",
      },
    },
    {
      $project: {
        "managers.username": 1,
        "managers._id": 1,
        creator: { $ifNull: [{ $arrayElemAt: ["$user.username", 0] }, ""] },
        _id: 1,
        name: 1,
        poster: 1,
        member_count: 1,
        post_count: 1,
        description: 1,
        nsfw: 1,
        links: 1,
        connections: 1,
        created_by: 1,
        edited_by: 1,
        createdAt: 1,
        editedAt: 1,
      }
    },
    {
      $project: {
        user: 0,
        moderators: 0,
      },
    },
  ]);

  return { result: results[0], success: true };
});