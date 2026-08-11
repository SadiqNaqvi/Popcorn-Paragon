import { getHandler } from "@lib/backend/helpers/handlers";
import { getInvitationCount,setInvitationCount } from "@lib/backend/redis/messaging";
import { Participant } from "@model";

export const GET = getHandler(async (r, params) => {
    const { cuid } = params;

    const countString = await getInvitationCount(cuid);

    // Because null returns 0 and if countString is null, count becomes 0 which is wrong;
    const count = Number(countString ?? undefined);
    if (!isNaN(count)) {
        return { success: true, result: count }
    }

    const countFromDb = await Participant.countDocuments({
        user_id: cuid,
        type: "invitee"
    });

    await setInvitationCount(cuid, countFromDb);

    return {
        success: true,
        result: countFromDb,
    }


})