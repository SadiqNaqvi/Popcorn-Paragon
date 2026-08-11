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
              followee: cuid,
              follower: "$$uid",
              blocked: false,
            }),
            { $count: "exists" }
          ],
          as: "follower"
        }
      },
      { $match: { $expr: { $eq: [{ $size: "$follower" }, 1] } } },
      { $project: { follower: 0 } }
    ],
  });
});
