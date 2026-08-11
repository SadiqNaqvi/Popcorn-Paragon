import { getHandler } from "@lib/backend/helpers/handlers";
import { convertMatchToLookupExpr, searchHandler } from "@lib/backend/helpers/pipelines";

// Search the joined threads of the current user.
export const GET = getHandler(async (r, params) => {
  const { cuid } = params;
  return await searchHandler({
    r,
    type: "threads",
    filters: [
      {
        $lookup: {
          from: "members",
          let: { tid: "$_id" },
          pipeline: [
            convertMatchToLookupExpr({
              user_id: cuid,
              thread_id: "$$tid",
              banned: false,
            }),
            { $count: "exists" }
          ],
          as: "member"
        }
      },
      { $match: { $expr: { $eq: [{ $size: "$member" }, 1] } } },
      { $project: { member: 0 } }
    ],
  });
});
