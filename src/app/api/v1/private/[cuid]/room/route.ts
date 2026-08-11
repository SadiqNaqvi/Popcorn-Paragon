import { getHandler } from "@lib/backend/helpers/handlers";
import { getRoomListFromCache, storeRoomList } from "@lib/backend/redis/messaging";
import { roomAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { getPageParams } from "@lib/backend/utils";
import Participant from "@model/participants";
import { RoomListResponse } from "@type/internal";

// Get Room list for the user
export const GET = getHandler(async (r, params) => {

  const { cuid } = params;

  const page = getPageParams(r) - 1;

  const roomList = await getRoomListFromCache(cuid, page);

  if (roomList && roomList.data.length)
    return { success: true, result: roomList };

  const resp = await Participant.aggregate(
    roomAggregationPipeline({ invitation: false, page, cuid }),
  );

  const result: { data: RoomListResponse[]; total: number } | undefined = resp[0];

  if (result && result.data.length)
    await storeRoomList(cuid, result.data, result.total);

  return {
    success: true,
    result: result ?? { data: [], total: 0 },
  };
});
