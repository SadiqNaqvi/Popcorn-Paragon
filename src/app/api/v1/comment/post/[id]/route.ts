import { filterToSort } from "@lib/shared/constants";
import { getHandler } from "@lib/backend/helpers/handlers";
import { attachNsfwInPipeline, commentsAggregationPipelineWithReplies } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Comment } from "@model";

// Get comments on a post
export const GET = getHandler(async (r, params) => {
  const { id } = params;

  const { page, filter, nsfw } = getSearchParams(r.nextUrl, 0, "latest");
  const sort = filterToSort.comments[filter] ?? filterToSort.comments.latest;

  const response = await Comment.aggregate(
    commentsAggregationPipelineWithReplies({
      filters: [{
        $match: attachNsfwInPipeline({ post_id: id }, nsfw)
      }],
      sort,
      page,
    })
  );

  return {
    success: true,
    result: response[0] ?? { data: [], total: 0 },
  };
});
