import { getUserFromToken } from "@lib/backend/utils";
import { getTrendingPosts, getUserFeed } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { createArray, getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import FeedPage from "./FeedPage";
import generateDynamicMetadata from "@lib/shared/seo/metadata";

export const metadata = generateDynamicMetadata({
    title: "Home",
    allowRobots: true,
})

const HomeFeedPage = async ({ searchParams }: ParloPageProps) => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);
    const queryClient = getQueryClient();
    const sp = await searchParams
    const page: number = parseInt(sp.p || "1") || 1;

    await Promise.all(
        createArray<any>(
            prefetchInfiniteQuery({
                queryClient,
                queryFn: () => getTrendingPosts(page, !!user?.filterContent),
                queryKey: getQueryKeys("trendingPosts", {}),
                initialPageParam: page,
            })
        ).concatConditionally(user, (u) =>
            prefetchInfiniteQuery({
                queryClient,
                queryFn: () => getUserFeed(u.user_id, page, !!user?.filterContent, jar),
                queryKey: getQueryKeys("curatedPost_uid", { uid: u.user_id }),
                initialPageParam: page
            })
        )
    )

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <FeedPage allowNsfw={!!user?.filterContent} />
        </HydrationBoundary>
    )
}

export default HomeFeedPage;