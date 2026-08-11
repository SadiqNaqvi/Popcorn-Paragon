import { getHandler } from "@lib/backend/helpers/handlers";
import { usernamePattern } from "@lib/shared/constants";
import { User } from "@model";
import { NextRequest } from "next/server";

// Check if a username is available to use or not.
export const GET = getHandler(async (req: NextRequest) => {
  const username = req.nextUrl.searchParams.get("username");

  if (!username || !usernamePattern.test(username))
    return { success: false, errCode: "invalid_input" };

  const resp = await User.exists({ username });
  return { result: Boolean(!resp), success: true };
});
