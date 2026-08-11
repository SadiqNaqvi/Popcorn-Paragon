import { updateHandler } from "@lib/backend/helpers/handlers";
import { addParticipantInRoom } from "@lib/backend/redis/messaging";
import { Room, User } from "@model";
import Participant from "@model/participants";

// Accepting room invitation.
export const PATCH = updateHandler({
  handler: async ({ params, user_id, session }) => {
    const { id } = params;

    const room = await Room.findById(id, { participant_count: 1 });

    if (!room)
      return { success: false, errCode: "resource_not_found" }

    if (room.participant_count === 1) {
      const creator = await Participant.findOneAndUpdate(
        { room_id: id, type: "creator" },
        {
          $unset: { expiresAt: 1 }
        },
        { session }
      );

      if (!creator)
        return { success: false, errCode: "resource_not_found" }

      await Room.findByIdAndUpdate(
        id,
        {
          $inc: { participant_count: 1 },
          $unset: { expiresAt: 1 }
        },
        { session }
      );

      await User.findByIdAndUpdate(
        creator.user_id,
        { $inc: { rooms: 1 } },
        { session }
      );
    } else {
      await Room.findByIdAndUpdate(
        id,
        { $inc: { participant_count: 1 } },
        { session }
      );
    }

    await User.findByIdAndUpdate(user_id, {
      $inc: { rooms: 1 }
    }, { session });

    await Participant.findOneAndUpdate(
      { room_id: id, user_id },
      {
        $set: { type: "participant", seenAt: new Date() },
        $unset: { expiresAt: 1 }
      },
      { session }
    );

    await addParticipantInRoom(user_id, id);
    return { success: true, result: null, revalidateQueue: [] };
  },
});