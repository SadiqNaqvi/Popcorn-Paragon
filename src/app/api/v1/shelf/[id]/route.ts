import { filterToSort } from "@lib/shared/constants";
import { getHandler } from "@lib/backend/helpers/handlers";
import { shelvesAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Shelf } from "@model";

// Get all the public shelves of the user.
export const GET = getHandler(async (r, params) => {
  const { id } = params;

  const { page, filter } = getSearchParams(r.nextUrl, 0, "latest");

  const sort = filterToSort.shelves[filter] ?? filterToSort.shelves.latest;

  const response = await Shelf.aggregate(
    shelvesAggregationPipeline({
      filters: [{
        $match: {
          user_id: id,
          isPrivate: false,
          shelf_type: "custom",
        }
      }],
      page,
      sort,
    })
  );

  return {
    success: true,
    result: response[0] ?? { data: [], total: 0 },
  };
});