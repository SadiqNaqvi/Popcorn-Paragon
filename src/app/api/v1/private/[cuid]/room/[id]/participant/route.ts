import { participantsLimitForGroup, participantsRemoveOrInviteLimit } from "@lib/shared/constants";
import { deleteRooms } from "@lib/backend/helpers/deletion";
import { deleteHandler, getHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { checkIfParticipantExists, getParticipantsFromCache, getParticipantsOfRoom, removeRoomFromInvitation, removeRoomFromList, updateParticipantSeenAt } from "@lib/backend/redis/messaging";
import { usersAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { publishAblyEvent } from "@lib/backend/providers/ably";
import { getPageParams } from "@lib/backend/utils";
import { Room, User } from "@model";
import Participant from "@model/participants";

// Get participants of a non-private room
export const GET = getHandler(async (r, params) => {

  const page = getPageParams(r) - 1;
  const { id, cuid } = params;

  const isParticipant = await checkIfParticipantExists(id, cuid);

  if (!isParticipant) return {
    success: false, errCode: "unauthenticated_access"
  }

  const cached = await getParticipantsFromCache(id);
  if (cached) return { success: true, result: cached };

  const response = await Participant.aggregate(
    usersAggregationPipeline({
      filters: [{ $match: { room_id: id } }],
      localFieldForLookup: "$user_id",
      page,
      limit: participantsLimitForGroup,
    })
  )

  const result = response[0] ?? { data: [], total: 0 };

  return { success: true, result }

});

// Update Participant seen at when participant enters a room
export const PATCH = updateHandler({
  handler: async ({ user_id, params }) => {
    const { id } = params;

    const done = await updateParticipantSeenAt(id, user_id);
    if (!done) return { success: false, errCode: "unauthorized_access" }

    const participants = await getParticipantsOfRoom(id);

    await publishAblyEvent(
      "entered_chat",
      { user_id, room_id: id, time: Date.now() },
      participants.filter(p => p.type !== "invitee").map(p => p.uid)
    )

    return { success: true, result: null, revalidateQueue: [] }
  }
});

// Leaving a room or rejecting room invitation
export const DELETE = deleteHandler(async ({ params, user_id, session }) => {
  const { id } = params;

  const participant = await Participant.findOneAndDelete(
    {
      room_id: id,
      user_id,
    },
    { session }
  );

  if (!participant)
    return { success: false, errCode: "resource_not_found" }

  else if (participant.type !== "invitee") {
    await User.findByIdAndUpdate(user_id, {
      $inc: { rooms: -1 }
    }, { session })
  }

  const room = await Room.findByIdAndUpdate(
    id,
    { $inc: { participant_count: -1 } },
    { session, new: true }
  )

  if (!room) return {
    success: false, errCode: "resource_not_found"
  }

  const totalParticipants = await Participant.countDocuments({ room_id: id }, { session });

  await removeRoomFromInvitation(user_id, id, Boolean(totalParticipants < 2));

  if (totalParticipants < 2) await deleteRooms({ _id: id }, session);
  else await removeRoomFromList(user_id, id);

  return { success: true, result: null, revalidateQueue: [] };
});