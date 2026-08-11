import { LoginModal } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils"
import { cookies } from "next/headers"
import { PropsWithChildren } from "react";

const Layout = async ({ children }: PropsWithChildren) => {
    const user = await getUserFromToken(await cookies());

    if (!user) return <LoginModal />

    return (
        <main>
            {children}
        </main>
    )
}

export default Layout;