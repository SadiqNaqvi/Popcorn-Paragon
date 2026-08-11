import LoginModal from "@components/fallbacks/LoginModal";
import { LoadingSpinner } from "@components/ui";
import { getUserFromToken } from "@lib/backend/utils";
import { getInvitedRooms, getInvitedRoomsCount, getRooms } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery, prefetchQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { PropsWithChildren, Suspense } from "react";
import RoomList from "./RoomList";
import { ChatSectionSkeleton } from "@components/ui/loading";

const InboxLayout = async ({ children }: PropsWithChildren) => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return (
        <LoginModal redirectTo="/room" />
    )

    const queryClient = getQueryClient();

    prefetchQuery({
        queryClient,
        queryFn: () => getInvitedRoomsCount(user.user_id, jar),
        queryKey: getQueryKeys("roomInvitationsCount_uid", { uid: user.user_id }),
    });

    prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getInvitedRooms(user.user_id, 1, jar),
        queryKey: getQueryKeys("roomInvitations_uid", { uid: user.user_id }),
    });

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getRooms(user.user_id, 1, jar),
        queryKey: getQueryKeys("rooms_uid", { uid: user.user_id }),
    });

    return (
        <main className="flex noPadding fullScreen overflow-hidden h-screen">
            <HydrationBoundary state={dehydrate(queryClient)}>
                <RoomList uid={user.user_id} />
                <Suspense fallback={<ChatSectionSkeleton />}>
                    {children}
                </Suspense>
            </HydrationBoundary>
        </main>
    )
}

export default InboxLayout;