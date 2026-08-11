import { getSession, storeSession } from "@lib/backend/auth/session";
import { generateToken } from "@lib/backend/auth/token";
import { setCookies } from "@lib/backend/auth/cookies";
import { getHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { currentUserPipeline } from "@lib/backend/helpers/pipelines";
import { userUpdateSchema } from "@lib/shared/validation/schemas";
import { calculateAge } from "@lib/shared/utils";
import { User } from "@model";
import { UserModelType } from "@type/models";
import { UserUpdateSchemaType } from "@type/schemas";
import { cookies } from "next/headers";

// Get the details of the profile of the current user.
export const GET = getHandler(async (_, params) => {
  const { cuid } = params;

  const response = await User.aggregate(
    currentUserPipeline({ _id: cuid })
  );

  if (!response.length) return { success: false, errCode: "resource_not_found" };

  const user: Omit<
    UserModelType,
    "passkey" | "session_id" | "isActive" | "lastLoginAt"
  > = response[0];

  const { banEndsAt, isBanned, ...result } = user;

  return { result, success: true };
});

// Update information of the current user
export const PATCH = updateHandler<UserUpdateSchemaType>({
  handler: async ({ data, session, user_id, username, frames, areFilesToDelete }) => {

    const dataToUpdate = {
      ...data,
      edited_at: new Date(),
      ...(frames && frames.length && { profile: frames[0] }),
      ...(data.dob && calculateAge(data.dob) < 18 ? { filterContent: true } : {})
    }

    await User.findByIdAndUpdate(
      user_id,
      {
        $set: dataToUpdate,
        ...(!frames.length && areFilesToDelete && { $unset: { profile: 1 } }),
      },
      { session }
    );

    if ("profile" in dataToUpdate || "dob" in dataToUpdate) {

      const cookieStore = await cookies();
      const sid = cookieStore.get("sid")?.value;

      if (!sid) return { success: false, errCode: "unauthenticated_access" }

      const { result, success } = await getSession(sid);

      if (!success || !result)
        return { success: false, errCode: "uncaught_error" };

      const { dob } = dataToUpdate;

      const sessionPayload = {
        ...result,
        ...(dob && { dob }),
        ...("profile" in dataToUpdate && { profile: dataToUpdate.profile }),
      };

      const stored = await storeSession(sid, sessionPayload);

      if (!stored) return { success: false, errCode: "data_storing_fail" }

      const { email, expireOn, ...tokenPayload } = sessionPayload;

      setCookies(cookieStore, "token", await generateToken(tokenPayload));

    }

    const updatedFields: Record<string, any> = {};

    Object.entries(dataToUpdate).forEach(entry => {
      const [k, v] = entry;

      if (v) updatedFields[k] = v;
    });

    return {
      success: true,
      result: updatedFields,
      available: "userMutation_uid_username",
      options: { uid: user_id, username },
    };
  },
  schema: userUpdateSchema,
});
