import { setCookies } from "@lib/backend/auth/cookies";
import { deleteSession, storeSession } from "@lib/backend/auth/session";
import { generateToken } from "@lib/backend/auth/token";
import { postHandler } from "@lib/backend/helpers/handlers";
import { storeUserMetaInCache } from "@lib/backend/redis/messaging";
import { verifyCode } from "@lib/backend/actions/email";
import { currentUserPipeline } from "@lib/backend/helpers/pipelines";
import { emailSchema } from "@lib/shared/validation/schemas";
import User from "@model/users";
import { MereShelf, TokenPayload } from "@type/internal";
import { UserModelType } from "@type/models";
import { ErrorCodes } from "@type/other";
import type { ClientSession } from "@type/mongoose";
import { cookies } from "next/headers";

type ResponseType = Omit<Required<UserModelType>, "isActive" | "lastLoginAt" | "password" | "session_id"> & { predefinedShelves: MereShelf }

const sessionManagement = async (
  user: ResponseType,
  session: ClientSession
): Promise<ErrorCodes | null | undefined> => {

  const session_id = crypto.randomUUID();

  const oldDoc = await User.findOneAndUpdate(
    { email: user.email },
    {
      lastLoginAt: new Date(),
      session_id,
      isActive: true,
      deletionId: undefined,
    },
    { session }
  );

  if (!oldDoc) return "resource_not_found";

  else if (oldDoc.session_id) deleteSession(oldDoc.session_id);

  const { _id, username, isBanned, email, banEndsAt, profile, filterContent, dob } = user;

  const id = _id.toString();

  const tokenPayload: TokenPayload & { email: string } = {
    user_id: id,
    username,
    email,
    isBanned,
    banEndsAt,
    profile,
    filterContent,
    dob,
  }

  const isStored = await storeSession(session_id, tokenPayload);

  if (!isStored) return "session_store_fail";

  const token = await generateToken(tokenPayload);
  const jar = await cookies();

  setCookies(jar, "token", token);
  setCookies(jar, "sid", session_id);

};

export const POST = postHandler<{ email: string, code: string, fingerprint: string }>({
  handler: async ({ data, session }) => {

    const { email, code, fingerprint } = data;
    const parsedEmail = emailSchema.safeParse(email);

    if (parsedEmail.error)
      return { success: false, errCode: "invalid_input" };

    const resp = await verifyCode(code, fingerprint);
    if (!resp.success) return resp;

    const results = await User.aggregate(currentUserPipeline({ email }));

    const user: ResponseType = results[0];

    if (!user) return { success: false, errCode: "unregistered_user" };

    await storeUserMetaInCache({ _id: user._id, username: user.username, profile: user.profile })

    const error = await sessionManagement(user, session);
    if (error) return { success: false, errCode: error };

    const { isBanned, banEndsAt, ...result } = user;

    return {
      result,
      success: true,
      available: "loginLogout_uid",
      options: { uid: user._id },
    };
  },
  skipUserCheck: true,
});
