import { participantsRemoveOrInviteLimit } from "@lib/shared/constants";
import { postHandler } from "@lib/backend/helpers/handlers";
import { addInvitedParticipants, checkIfParticipantExists } from "@lib/backend/redis/messaging";
import { createArrayOfUidsSchema } from "@lib/shared/validation/schemas";
import { Participant, Room } from "@model";

const schema = createArrayOfUidsSchema(participantsRemoveOrInviteLimit);

// Inviting Users to join a group
export const POST = postHandler<{ users: string[] }>({
    handler: async ({ data, params, session }) => {

        const { id } = params;
        const { users } = data;

        const room = await Room.findById(id, { createdAt: 1 });
        if (!room) return { success: false, errCode: "resource_not_found" };

        await Participant.create(
            users.map(user => ({
                room_id: id,
                type: "invitee",
                user_id: user,
            })),
            { session }
        );

        await addInvitedParticipants(id, users);

        return {
            success: true,
            result: null,
            revalidateQueue: []
        }

    },
    schema,
    preCheck: async ({ user_id, params }) => {
        const exists = await checkIfParticipantExists(params.id, user_id);

        if (exists) return { success: true }
        return { success: false, errCode: "unauthorized_access" }
    }
});