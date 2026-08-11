import { deleteSession } from "@lib/backend/auth/session";
import { updateHandler } from "@lib/backend/helpers/handlers";
import { User } from "@model";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs"

// Add that user can deactivate only once a week,
export const PATCH = updateHandler<{ passkey: string }>({
    handler: async ({ user_id, username, session, data }) => {

        const { passkey } = data;

        const check = await User.findById(user_id, { passkey: 1 });

        if (!passkey || !check || !bcrypt.compareSync(passkey, check.passkey))
            return { success: false, errCode: "unauthorized_access" }

        const user = await User.findByIdAndUpdate(
            user_id,
            { isActive: false },
            { session }
        );

        if (!user) return { success: false, errCode: "resource_not_found" }

        deleteSession(user.session_id);
        const jar = await cookies()
        jar.delete("sid");
        jar.delete("token");

        return {
            success: true,
            result: null,
            available: "userMutation_uid_username",
            options: { username, uid: user_id }
        }
    }
})