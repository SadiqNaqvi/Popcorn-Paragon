import { deleteSession } from "@lib/backend/auth/session";
import { deleteHandler } from "@lib/backend/helpers/handlers";
import { User } from "@model";
import { cookies } from "next/headers";

export const DELETE = deleteHandler(async ({ user_id }) => {
  const cookieStore = await cookies();
  const session_id = cookieStore.get("sid")?.value;

  if (!session_id)
    return { success: false, errCode: "unauthenticated_access" };

  await User.findOneAndUpdate(
    { session_id },
    { $set: { session_id: undefined } }
  );

  await deleteSession(session_id);

  cookieStore.delete("sid");
  cookieStore.delete("token");

  return {
    result: null,
    success: true,
    available: "loginLogout_uid",
    options: { uid: user_id },
    files: [],
  };
});
