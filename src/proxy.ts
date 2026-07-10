import { getSession } from "@lib/auth/session";
import { generateToken, verifyToken } from "@lib/auth/token";
import { deleteAuthCookies, setCookies } from "@lib/auth/cookies";
import { slidingWindowRateLimit } from "@lib/helpers/redis/rate_limiting";
import { ErrorCodes } from "@type/other";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const getUidAndPath = (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (!pathname.includes("api/v1/private")) return {
    user_id: null,
    path: pathname
  }

  const paths = pathname.split("/private/")[1]?.split("/");
  if (!paths) throw new Error(`Inavlid pathname in URL! ${pathname}`);

  const [uid, ...rest] = paths;

  return {
    user_id: uid,
    path: rest.join('/')
  }
}

const validateUser = async (
  rq: NextRequest,
  rs: NextResponse
): Promise<
  { success: true, user_id: string } | { success: false; errCode: ErrorCodes; reason?: "noTokenORSession" | "banned" }
> => {
  const jar = await cookies();
  const token = jar.get("token")?.value;
  const session_id = jar.get("sid")?.value;

  if (!token || !session_id)
    return { success: false, errCode: "unauthenticated_access", reason: "noTokenORSession" };

  const payload = await verifyToken(token);

  console.log("Token Payload in Proxy", !!payload);

  const uid = getUidAndPath(rq).user_id;

  // If token is invalid or tampered
  if (!payload || (uid && payload.user_id !== uid))
    return { success: false, errCode: "unauthenticated_access" };

  const { user_id } = payload;

  // If token is neither tampered nor expired, return true;

  if (payload.exp && (payload.exp * 1000) > Date.now())
    return { success: true, user_id };

  // console.log("Now checking session in Proxy");
  // If token is expired, check user session
  const { result, success } = await getSession(session_id);

  console.log("Is session in proxy", success, result);

  // If session could not be fetched possibly because of network 
  if (!success) return { success: false, errCode: "unstable_internet" };

  // If session is not available, delete cookies
  else if (!result) {
    console.log("deleting cookies in proxy");
    deleteAuthCookies(rs.cookies)
    return { success: false, errCode: "unauthenticated_access" };
  }

  console.log("Generating new token in Proxy");
  // If session is available, refresh token
  const { email, expireOn, ...tokenPayload } = result;

  const newToken = await generateToken(tokenPayload);

  setCookies(rs.cookies, "token", newToken);

  // If token is temporarily banned
  if (result.isBanned && result.banEndsAt && new Date(result.banEndsAt).getTime() > Date.now())
    return { success: false, errCode: "temporary_banned" }

  return { success: true, user_id };
};

export const proxy = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  console.log("PROXY entered for", req.method, "method at:", pathname);

  const response = NextResponse.next();

  // Check if there's a current user
  const user = await validateUser(req, response);

  console.log("is User in PROXY:", user.success);

  // If user does exists and user is trying to perform mutation, check limitation.
  if (user.success && req.method !== "GET") {
    const limit = await slidingWindowRateLimit(req, user.user_id);

    if (!limit.allowed) return NextResponse.json({
      success: false,
      errCode: "rate_limit_exceed",
    },
      { status: 429 });
  }

  // If user does not exists
  else if (!user.success) {

    // If and only if user is trying to get shelf or shelf item, then only allow guest to go further.
    if (req.method === "GET" && (pathname.includes("/shelf") || pathname.includes("/item")) && user.reason === "noTokenORSession")
      return response;

    console.log("user for", pathname, user);

    // If user is a guest and trying to do anything private (which only authenticated users can do)
    if (pathname.includes("/api/v1/private"))
      return NextResponse.json(user, { status: 403 });

  }

  console.log("PROXY DONE");
  return response;
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (static files & image optimization files)
     * - ably auth route
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    // "/((?!_next|api\/v1\/ably|sitemap.xml|sitemaps\/*|robots.txt|.*\\..*).*)",
    "/((?!_next|api\/v1\/ably|robots\\.txt|.*\\.xml|sitemap\\.xml|sitemaps(?:/.*)?|.*\\..*).*)"
  ]
};