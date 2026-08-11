import { getHandler } from "@lib/backend/helpers/handlers";
import { convertMatchToLookupExpr, searchHandler } from "@lib/backend/helpers/pipelines";

// Search non-blocked users
export const GET = getHandler(async (r, params) => {

    const { cuid } = params;

    return await searchHandler({
        filters: [
            {
                $lookup: {
                    from: "connections",
                    let: { ruid: "$_id" },
                    pipeline: [
                        convertMatchToLookupExpr({
                            $or: [
                                {
                                    follower: cuid,
                                    followee: "$$ruid",
                                    blocked: true
                                },
                                {
                                    followee: cuid,
                                    follower: "$$ruid",
                                    blocked: true
                                },
                            ]
                        }),
                        { $count: "exists" }
                    ],
                    as: "isOrHaveBlocked",
                }
            },
            { $match: { $expr: { $eq: [{ $size: "$isOrHaveBlocked" }, 0] } } },
            { $project: { isOrHaveBlocked: 0 } }
        ],
        r,
        type: "users"
    });
});