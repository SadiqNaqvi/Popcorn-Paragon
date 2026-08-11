import { getHandler } from "@lib/backend/helpers/handlers";
import { convertMatchToLookupExpr, shelfProjection } from "@lib/backend/helpers/pipelines";
import { User } from "@model";

// Get User by username
export const GET = getHandler(async (_, params) => {
  const { username } = params;

  const response = await User.aggregate([
    { $match: { username, isActive: true } },
    {
      $lookup: {
        from: "shelves",
        let: { id: "$_id" },
        pipeline: [
          convertMatchToLookupExpr({
            user_id: "$$id",
            isPrivate: false,
            shelf_type: { $ne: "custom" }
          }),
          { $project: shelfProjection }
        ],
        as: "predefinedShelves",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        username: 1,
        profile: 1,
        bio: 1,
        bioLinks: 1,
        followers: 1,
        following: 1,
        posts: 1,
        comments: 1,
        publicShelves: 1,
        predefinedShelves: 1,
      },
    },
  ]);

  return { result: response[0], success: true };
});
