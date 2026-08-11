import { LoginModal } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils";
import { getNotificationsOfUser } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import NotificationPage from "./NotificationPage";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

const Page = async ({ searchParams }: ParloPageProps) => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return (
        <LoginModal
            redirectTo="/notifications"
        />
    )

    const sp = await searchParams;
    const page = parseInt(sp.p || '1') || 1;

    const queryClient = getQueryClient();

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getNotificationsOfUser(user.user_id, page),
        queryKey: getQueryKeys("notifications_uid", { uid: user.user_id })
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <NotificationPage />
        </HydrationBoundary>
    )

}

export default Page;