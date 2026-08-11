import { getHandler } from "@lib/backend/helpers/handlers";
import { shelvesAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Shelf } from "@model";

// Get popular shelves.
export const GET = getHandler(async (r) => {

    const { page } = getSearchParams(r.nextUrl, 0);

    const response = await Shelf.aggregate(
        shelvesAggregationPipeline({
            filters: [{
                $match: { isPrivate: false, shelf_type: "custom" }
            }],
            page,
            sort: { last_added: -1, saved_count: -1 },
        })
    );

    return {
        success: true,
        result: response[0] ?? { data: [], total: 0 },
    };
});