import { filterToSort } from "@lib/shared/constants";
import { getHandler } from "@lib/backend/helpers/handlers";
import { attachNsfwInPipeline, postsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Post } from "@model";

// Get Posts of a user by user_id
export const GET = getHandler(async (r, params) => {
  const { id, cuid } = params;

  const { page, nsfw, filter } = getSearchParams(r.nextUrl, 1, "latest");

  const sort = filterToSort.userPosts[filter] ?? filterToSort.userPosts.latest;

  const response = await Post.aggregate(
    postsAggregationPipeline({
      filters: [{ $match: attachNsfwInPipeline({ user_id: id }, id === cuid ? true : nsfw) }],
      sort, page,
      excludeQuotedPost: false,
      isLinkBased: false,
    })
  );

  return {
    success: true,
    result: response[0] ?? { data: [], total: 0 },
  };
});
