import { getHandler } from "@lib/backend/helpers/handlers";
import { getInvitationListFromCache, storeInvitationInCache } from "@lib/backend/redis/messaging";
import { roomAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getPageParams } from "@lib/backend/utils";
import Participant from "@model/participants";

// Get all the rooms where the current user is invited
export const GET = getHandler(async (r, params) => {
  const page = getPageParams(r) - 1;
  const { cuid } = params;

  const cachedResult = await getInvitationListFromCache(cuid);
  if (cachedResult) return { success: true, result: cachedResult }

  const resp = await Participant.aggregate(
    roomAggregationPipeline({ invitation: true, page, cuid })
  );

  const result = resp[0];

  if (result && result.data.length)
    await storeInvitationInCache(cuid, result);

  return { success: true, result };
});
