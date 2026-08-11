import { emailPattern } from "@lib/shared/constants";
import { getHandler } from "@lib/backend/helpers/handlers";
import { User } from "@model";

// Check if a user exists with a certain email
export const GET = getHandler(async (req) => {

  const email = req.nextUrl.searchParams.get("email");

  if (!email || !emailPattern.test(email)) return {
    success: false,
    errCode: "invalid_input",
    custom_error: "Invalid Email! Please use a valid email and try again"
  };

  const res = await User.exists({ email });

  return { result: Boolean(res), success: true };
});
