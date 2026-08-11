import { getHandler } from "@lib/backend/helpers/handlers";
import Collaborator from "@model/collaborators";

// Check if a user is collaborator/invitee of the shelf or not
export const GET = getHandler(async (r, params) => {

    const { cuid, id } = params;

    const response = await Collaborator.findOne({
        user_id: cuid,
        shelf_id: id
    }).exec();

    return {
        success: true,
        result: response,
    }

})