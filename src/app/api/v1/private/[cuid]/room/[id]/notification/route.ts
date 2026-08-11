import { updateHandler } from "@lib/backend/helpers/handlers";
import { updateRoomNotification } from "@lib/backend/redis/messaging";
import { Participant } from "@model";

// Toggle room notification

export const PATCH = updateHandler<{ notification: boolean }>({
    handler: async ({ user_id, params, data }) => {

        const { id } = params;

        await Participant.findOneAndUpdate(
            { user_id, room_id: id },
            { $set: { mute: Boolean(data.notification) } }
        );

        await updateRoomNotification(id, user_id, Boolean(data.notification));

        return {
            success: true,
            result: null,
            revalidateQueue: [],
        }

    }
})