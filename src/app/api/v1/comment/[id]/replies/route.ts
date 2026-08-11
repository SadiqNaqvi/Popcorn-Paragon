import { filterToSort } from "@lib/shared/constants";
import { getHandler } from "@lib/backend/helpers/handlers";
import { attachNsfwInPipeline, commentsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Comment } from "@model";

// Get replies on a comment;
export const GET = getHandler(async (r, params) => {
  const { id } = params;
  const { filter, nsfw, page } = getSearchParams(r.nextUrl, 0, "latest");
  const sort = filterToSort.comments[filter] ?? filterToSort.comments.latest;

  const response = await Comment.aggregate(
    commentsAggregationPipeline({
      filters: [{
        $match: attachNsfwInPipeline({ replied_to: id }, nsfw)
      }],
      sort,
      page
    })
  );

  return {
    success: true,
    result: response[0] ?? { data: [], total: 0 },
  };
});
