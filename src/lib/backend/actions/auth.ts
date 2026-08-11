"use server";

import { getSession } from "@lib/backend/auth/session";
import { verifyToken } from "@lib/backend/auth/token";
import { cookies } from "next/headers";

export const deleteUserFromCookies = async () => {

  const jar = await cookies();
  jar.delete("sid");
  jar.delete("token");
};

export const authenticateUser = async () => {
  const jar = await cookies();
  const token = jar.get("token")?.value;
  const session_id = jar.get("sid")?.value;

  if (!token || !session_id) return null;

  const payload = await verifyToken(token);

  // If token is invalid or tampered
  if (!payload) return null;

  // If token is neither tampered nor expired, return true;
  if (payload.exp && (payload.exp * 1000) > Date.now())
    return payload

  // If token is expired, check user session
  const { result, success } = await getSession(session_id);

  // If session could not be fetched possibly because of network 
  if (!success) return null;

  // If session is not available, delete cookies
  else if (!result) {
    deleteUserFromCookies();
    return null;
  }

  return result;
}