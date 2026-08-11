import LoginModal from "@components/fallbacks/LoginModal";
import { getUserFromToken } from "@lib/backend/utils";
import { getFollowing } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import FollowingList from "./FollowingList";
import { ParloPageProps } from "@type/other";

const FollowingPage = async ({ searchParams }: ParloPageProps) => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);
    const { p } = await searchParams;

    const queryClient = getQueryClient();

    if (!user) return (
        <LoginModal redirectTo="/settings/following" />
    );

    const page = parseInt(p || "1") || 1;

    await prefetchInfiniteQuery({
        queryFn: () => getFollowing(user.user_id, page, jar),
        queryClient,
        initialPageParam: page,
        queryKey: getQueryKeys("followingOfCurrentUser_uid", { uid: user.user_id })
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <FollowingList />
        </HydrationBoundary>
    )
}

export default FollowingPage;