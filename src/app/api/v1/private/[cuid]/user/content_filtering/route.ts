import { getSession, storeSession } from "@lib/backend/auth/session";
import { generateToken } from "@lib/backend/auth/token";
import { setCookies } from "@lib/backend/auth/cookies";
import { updateHandler } from "@lib/backend/helpers/handlers";
import { User } from "@model";
import { cookies } from "next/headers";

// Toggling Content Filter setting
export const PATCH = updateHandler({
    handler: async ({ user_id, session }) => {

        await User.findByIdAndUpdate(
            user_id,
            [{ $set: { filterContent: { $not: "$filterContent" } } }],
            { session, updatePipeline: true }
        );

        const cookieStore = await cookies();

        const sid = cookieStore.get("sid")?.value ?? "";

        const { result, success } = await getSession(sid);

        if (!success || !result)
            return { success: false, errCode: "unknown_error" };

        const sessionPayload = { ...result, filterContent: !result.filterContent }
        const { email, expireOn, ...tokenPayload } = sessionPayload;

        setCookies(cookieStore, "token", await generateToken(tokenPayload));

        const stored = await storeSession(sid, sessionPayload);

        if (!stored) return { success: false, errCode: "data_storing_fail" }

        return {
            success: true,
            result: null,
            revalidateQueue: [`currentUser-${user_id}`]
        }

    }
});