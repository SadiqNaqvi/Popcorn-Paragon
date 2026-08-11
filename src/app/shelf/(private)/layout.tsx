import LoginModal from "@components/fallbacks/LoginModal";
import { getUserFromToken } from "@lib/backend/utils";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { cookies } from "next/headers";
import { PropsWithChildren } from "react";

export const metadata = generateDynamicMetadata({ allowRobots: false });

const ShelfAuthLayout = async ({ children }: PropsWithChildren) => {
    const user = await getUserFromToken(await cookies());

    if (!user) return (
        <LoginModal redirectTo="/shelf" title="Shelves" />
    )

    return children;

}

export default ShelfAuthLayout;