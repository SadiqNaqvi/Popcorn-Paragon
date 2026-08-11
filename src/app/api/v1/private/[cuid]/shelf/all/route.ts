import { getHandler } from "@lib/backend/helpers/handlers";
import { shelvesAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Shelf } from "@model";

// Get all the custom shelves of user (private + public)
export const GET = getHandler(async (r, params) => {
    const { cuid } = params;
    const { page } = getSearchParams(r.nextUrl);

    const shelves = await Shelf.aggregate(
        shelvesAggregationPipeline({
            filters: [{
                $match: { user_id: cuid, shelf_type: "custom" }
            }],
            sort: { createdAt: -1 },
            page,
        })
    );

    return { success: true, result: shelves[0] ?? { data: [], total: 0 } };
});