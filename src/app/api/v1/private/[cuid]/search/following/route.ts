import { getHandler } from "@lib/backend/helpers/handlers";
import { convertMatchToLookupExpr, searchHandler } from "@lib/backend/helpers/pipelines";

export const GET = getHandler(async (r, params) => {
  const { cuid } = params;
  return await searchHandler({
    r,
    type: "users",
    filters: [
      {
        $lookup: {
          from: "connections",
          let: { uid: "$_id" },
          pipeline: [
            convertMatchToLookupExpr({
              follower: cuid,
              followee: "$$uid",
              blocked: false,
            }),
            { $count: "exists" }
          ],
          as: "following"
        }
      },
      { $match: { $expr: { $eq: [{ $size: "$following" }, 1] } } },
      { $project: { following: 0 } }
    ],
  });
});
