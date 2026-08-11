import { getHandler } from "@lib/backend/helpers/handlers";
import { usersAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getPageParams } from "@lib/backend/utils";
import { Connection } from "@model";

// Get followers of the current user
export const GET = getHandler(async (r, params) => {
  const { cuid } = params;
  const page = getPageParams(r) - 1;

  const resp = await Connection.aggregate(
    usersAggregationPipeline({
      filters: [{ $match: { followee: cuid, blocked: false } }],
      page,
      sort: { createdAt: -1 },
      localFieldForLookup: "follower",
    })
  );

  const result = resp[0] ?? { data: [], total: 0 };
  return { success: true, result };
});
