import { participantsRemoveOrInviteLimit } from "@lib/shared/constants";
import { postHandler } from "@lib/backend/helpers/handlers";
import { getParticipant, removeParticipantsFromCache } from "@lib/backend/redis/messaging";
import { createArrayOfUidsSchema } from "@lib/shared/validation/schemas";
import { Participant, User } from "@model";

const schema = createArrayOfUidsSchema(participantsRemoveOrInviteLimit);

// Removing participants from a room
export const POST = postHandler<{ users: string[] }>({
    handler: async ({ data, params, session }) => {

        const { id } = params;
        const { users } = data;

        const participants = await Participant.find({
            room_id: id,
            user_id: { $in: users },
            type: { $ne: "invitee" }
        }, { _id: 1 });

        await Promise.all(participants.map((_id) => {
            return User.findByIdAndUpdate(_id, {
                $inc: { rooms: -1 }
            }, { session })
        }));

        await Participant.deleteMany({
            user_id: { $in: users },
            room_id: id,
        }, { session });

        await removeParticipantsFromCache(id, users);

        return {
            success: true,
            result: null,
            revalidateQueue: []
        }

    },
    schema,
    preCheck: async ({ user_id, params }) => {
        const participant = await getParticipant(params.id, user_id);

        if (participant?.participantType === "creator") return { success: true }
        return { success: false, errCode: "unauthorized_access" }
    }
});