import { getHandler } from "@lib/backend/helpers/handlers";
import { attachNsfwInPipeline, postsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Post } from "@model";

// Get posts which quoted a certain post
export const GET = getHandler(async (r, params) => {
  const { id } = params;

  const { page, nsfw } = getSearchParams(r.nextUrl, 0);

  const response = await Post.aggregate(
    postsAggregationPipeline({
      filters: [{ $match: attachNsfwInPipeline({ quoted_post_id: id, }, nsfw) }],
      page,
      sort: { createdAt: -1 },
      excludeQuotedPost: true,
      isLinkBased: false,
    })
  );

  return {
    success: true,
    result: response[0] ?? { data: [], total: 0 },
  };
});
