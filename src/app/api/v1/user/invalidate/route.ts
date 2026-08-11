import { deleteSession } from "@lib/backend/auth/session";
import { updateHandler } from "@lib/backend/helpers/handlers";
import { sessionInvalidationSchema } from "@lib/shared/validation/schemas";
import { User } from "@model";
import { SessionInvalidationServerSchemaType } from "@type/schemas";
import bcrypt from "bcryptjs";

export const PATCH = updateHandler<SessionInvalidationServerSchemaType>({
    handler: async ({ data }) => {

        const { email, passKey } = data;

        const user = await User.findOne(
            { email },
            { session_id: 1, passkey: 1 }
        ).exec();

        if (!user)
            return { success: false, errCode: "resource_not_found" }
        else if (!bcrypt.compareSync(passKey, user.passkey))
            return { success: false, errCode: "unauthorized_access" }

        await deleteSession(user.session_id);

        return {
            success: true,
            result: null,
            revalidateQueue: [],
        }
    },

    schema: sessionInvalidationSchema,
});