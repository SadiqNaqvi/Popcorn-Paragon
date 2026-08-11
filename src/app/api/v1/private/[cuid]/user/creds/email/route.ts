import { getSession, storeSession } from "@lib/backend/auth/session";
import { updateHandler } from "@lib/backend/helpers/handlers";
import { verifyCode } from "@lib/backend/actions/email";
import { emailUpdateSchema } from "@lib/shared/validation/schemas";
import { getTimeInFuture } from "@lib/shared/utils";
import { User } from "@model";
import { EmailUpdateSchemaType } from "@type/schemas";
import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const PATCH = updateHandler<EmailUpdateSchemaType>({
  handler: async ({ data, user_id }) => {
    const { passkey, code, fingerprint, email } = data;

    const verification = await verifyCode(code, fingerprint);

    if (!verification.success) return verification;

    const user = await User.findById(user_id, { passkey: 1, emailUpdatedAt: 1 }).exec();

    if (!user)
      return { success: false, errCode: "unauthenticated_access" };
    else if (
      user.emailUpdatedAt &&
      getTimeInFuture({ unit: "mo", from: user.emailUpdatedAt }) > Date.now()
    )
      return { success: false, errCode: "early_identification_update" };

    if (!bcrypt.compareSync(passkey, user.passkey))
      return { success: false, errCode: "wrong_passkey" };

    const cookieStore = await cookies();
    const sid = cookieStore.get("sid")?.value;

    if (!sid) return { success: false, errCode: "unauthenticated_access" }

    const { result, success } = await getSession(sid);

    if (!success || !result)
      return { success: false, errCode: "uncaught_error" };

    const stored = await User.findByIdAndUpdate(user_id, {
      $set: { email, emailUpdatedAt: new Date() },
    });

    if (!(await storeSession(sid, { ...result, email })))
      return {
        success: false,
        errCode: "session_store_fail",
      };

    return {
      success: true,
      available: "userEmailMutation_uid_oldEmail_newEmail",
      options: { oldEmail: result.email, newEmail: email, uid: user_id },
      result: stored,
    };
  },
  schema: emailUpdateSchema,
});
