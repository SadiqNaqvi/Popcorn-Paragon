import { updateHandler } from "@lib/backend/helpers/handlers";
import { hideRoomInCache } from "@lib/backend/redis/messaging";
import { Participant } from "@model";

// Hiding a room from room list
export const PATCH = updateHandler({
    handler: async ({ user_id, params, session }) => {
        const { id } = params;

        await Participant.findOneAndUpdate(
            { user_id, room_id: id },
            { $set: { hideAt: new Date() } },
            { session }
        );

        await hideRoomInCache(id, user_id);

        return {
            success: true,
            result: null,
            revalidateQueue: []
        }

    }
})