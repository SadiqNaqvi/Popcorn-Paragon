import { getHandler } from "@lib/backend/helpers/handlers";
import { usersAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { Member } from "@model";

// Get all the members of a thread
export const GET = getHandler(async (r, params) => {
  const { id } = params;
  const { page } = getSearchParams(r.nextUrl);
  const response = await Member.aggregate(
    usersAggregationPipeline({
      filters: [
        { $match: { thread_id: id, banned: false } },
      ],
      localFieldForLookup: "user_id",
      page,
      sort: { createdAt: -1 },
    })
  );

  return {
    success: true,
    result: response[0] ?? { data: [], total: 0 }
  };
});
