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
                            blocked: true
                        }),
                        { $count: "exists" }
                    ],
                    as: "blocked"
                }
            },
            { $match: { $expr: { $eq: [{ $size: "$blocked" }, 1] } } },
            { $project: { blocked: 0 } }
        ],
    });
});
