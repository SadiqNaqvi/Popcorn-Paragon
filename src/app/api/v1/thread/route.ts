import { filterToSort } from "@lib/shared/constants";
import { getHandler } from "@lib/backend/helpers/handlers";
import { threadsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Thread } from "@model";
import { NextRequest } from "next/server";

// Get threads by filters
export const GET = getHandler(async (r: NextRequest) => {

  const { filter, nsfw, page } = getSearchParams(r.nextUrl, 0, "latest");
  const sort = filterToSort.threads[filter] ?? filterToSort.threads.latest;

  const result = await Thread.aggregate(
    threadsAggregationPipeline({
      filters: nsfw ? [] : [{ $match: { nsfw } }],
      page,
      sort,
    })
  );

  const threads = result[0];

  if (!threads) return { success: false, errCode: "resource_not_found" };
  return { result: threads, success: true };
});
