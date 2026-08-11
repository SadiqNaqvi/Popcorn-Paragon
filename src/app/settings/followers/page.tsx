import LoginModal from "@components/fallbacks/LoginModal";
import { getUserFromToken } from "@lib/backend/utils";
import { getFollowers } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import FollowerList from "./FollowerList";
import { ParloPageProps } from "@type/other";

const FollowersPage = async ({ searchParams }: ParloPageProps) => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    const queryClient = getQueryClient();

    if (!user) return (
        <LoginModal redirectTo="/settings/followers" />
    );
    const { p } = await searchParams;
    const page = parseInt(p || "1") || 1;

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getFollowers(user.user_id, page, jar),
        initialPageParam: page,
        queryKey: getQueryKeys("followersOfCurrentUser_uid", { uid: user.user_id })
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <FollowerList />
        </HydrationBoundary>
    )
}

export default FollowersPage;