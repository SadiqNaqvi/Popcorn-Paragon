import { getHandler } from "@lib/backend/helpers/handlers";
import { threadsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getPageParams } from "@lib/backend/utils";
import { Member } from "@model";

// Get all the threads manage by the current user.
export const GET = getHandler(async (r, params) => {
    const page = getPageParams(r) - 1;
    const { cuid } = params;

    const response = await Member.aggregate(
        threadsAggregationPipeline({
            filters: [{ $match: { user_id: cuid, banned: false, role: "moderator" } }],
            localFieldForLookup: "thread_id",
            page,
            sort: { createdAt: -1 },
            nsfw:true,
        })
    );

    return {
        result: response[0] ?? { data: [], total: 0 },
        success: true
    };
});
