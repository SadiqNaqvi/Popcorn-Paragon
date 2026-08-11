import { getHandler } from "@lib/backend/helpers/handlers";
import { convertMatchToLookupExpr, searchHandler } from "@lib/backend/helpers/pipelines";

// Searching Banned Users
export const GET = getHandler(async (r, params) => {
  const { id } = params;

  return await searchHandler({
    r,
    filters: [
      {
        $lookup: {
          from: "members",
          let: { uid: "$_id" },
          pipeline: [
            convertMatchToLookupExpr({
              thread_id: id,
              user_id: "$$uid",
              banned: true
            }),
            { $count: "exists" }
          ],
          as: "member"
        },
      },
      { $match: { $expr: { $eq: [{ $size: "$member" }, 1] } } },
      { $project: { member: 0 } }
    ],
    type: "users",
  });
});
