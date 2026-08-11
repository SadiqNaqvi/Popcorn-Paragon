import { getHandler } from "@lib/backend/helpers/handlers";
import { threadsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getPageParams } from "@lib/backend/utils";
import { Thread } from "@model";

// Get all the threads created by the current user.
export const GET = getHandler(async (r, params) => {
    const page = getPageParams(r) - 1;
    const { cuid } = params;

    const response = await Thread.aggregate(
        threadsAggregationPipeline({
            filters: [{ $match: { created_by: cuid } }],
            page,
            sort: { createdAt: -1 },
        })
    );

    return {
        result: response[0] ?? { data: [], total: 0 },
        success: true
    };
});
