import { filterToSort } from "@lib/shared/constants";
import { getHandler } from "@lib/backend/helpers/handlers";
import { attachNsfwInPipeline, commentsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Comment } from "@model";

// Get comments of a user by user_id
export const GET = getHandler(async (r, params) => {

  const { id } = params;
  const { filter, nsfw, page, } = getSearchParams(r.nextUrl, 0, "loved");
  const sort = filterToSort.comments[filter] ?? filterToSort.comments.loved;

  const response = await Comment.aggregate(
    commentsAggregationPipeline({
      filters: [{
        $match: attachNsfwInPipeline({ user_id: id }, nsfw)
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
