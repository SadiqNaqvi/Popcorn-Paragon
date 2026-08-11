import { getUserFromToken } from "@lib/backend/utils";
import { getHandler } from "@lib/backend/helpers/handlers";
import { convertMatchToLookupExpr, searchHandler } from "@lib/backend/helpers/pipelines";
import { cookies } from "next/headers";

// Search Members of a thread with thread_id (id)

export const GET = getHandler(async (r, params) => {
  const { id } = params;

  const user = await getUserFromToken(await cookies());
  const cuid = user?.user_id;

  return await searchHandler({
    r,
    filters: [
      ...(cuid ? [{ $match: { _id: { $ne: cuid } } }] : []),
      {
        $lookup: {
          from: "members",
          let: { uid: "$_id" },
          pipeline: [
            convertMatchToLookupExpr({
              user_id: "$$uid",
              thread_id: id,
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
    type: "users",
  });

});
