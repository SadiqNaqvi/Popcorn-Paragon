import "server-only";

import { oneDayInSeconds } from "@lib/shared/constants";
import { NextResponse } from "next/server";

type Cookies = NextResponse<any>["cookies"];

const maxAge = oneDayInSeconds * 30;

export const setCookies = (jar: Cookies, key: string, value: any) => {
    jar.set(key, value, {
        httpOnly: true,
        secure: true,
        maxAge,
        expires: new Date(Date.now() + maxAge * 1000),
        sameSite: "lax",
        path: "/",
    });
}

export const deleteAuthCookies = (jar: Cookies) => {
    jar.delete("token");
    jar.delete("sid");
}