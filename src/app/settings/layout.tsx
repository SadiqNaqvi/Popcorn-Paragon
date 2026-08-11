import LoginModal from "@components/fallbacks/LoginModal";
import { getUserFromToken } from "@lib/backend/utils";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
    title: "Settings",
};

const SettingsLayout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const user = await getUserFromToken(await cookies());

    if (!user) return (
        <LoginModal redirectTo="/settings" />
    )

    return (
        <main>
            {children}
        </main>
    )
}

export default SettingsLayout;