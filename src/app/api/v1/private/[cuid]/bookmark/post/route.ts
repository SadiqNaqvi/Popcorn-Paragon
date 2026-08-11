import { getHandler } from "@lib/backend/helpers/handlers";
import { bookmarkAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getPageParams } from "@lib/backend/utils";
import { Bookmark } from "@model";

// Get all the saved posts of the current user
export const GET = getHandler(async (r, params) => {
  const page = getPageParams(r) - 1;
  const { cuid } = params;

  const response = await Bookmark.aggregate(
    bookmarkAggregationPipeline({
      filters: [
        { $match: { user_id: cuid, content_type: "Post" } },
      ],
      type: "post",
      page,
    })
  );

  return {
    success: true,
    result: response[0] ?? { data: [], total: 0 }
  };
});
