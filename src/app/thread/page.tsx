import FilterTiles from "@components/FilterTiles";
import { ThreadNavbar } from "@components/TopNavbar";
import { getUserFromToken } from "@lib/backend/utils";
import { getThreads } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys, refineSearchParams } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import ThreadList from "./ThreadList";

const PopularThreadsPage = async ({ searchParams }: ParloPageProps) => {
    const sp = await searchParams;

    const { filter, page } = refineSearchParams("threads", sp.p, sp.f)

    const queryClient = getQueryClient();

    const user = await getUserFromToken(await cookies());

    const allowNsfw = user ? !user.filterContent : false;

    await prefetchInfiniteQuery({
        queryClient,
        queryKey: getQueryKeys("threads_filter", { filter }),
        queryFn: () => getThreads(page, allowNsfw, filter),
        initialPageParam: page,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ThreadNavbar />
            <section className="my-4 px-2">
                <FilterTiles type="threads" />
            </section>
            <ThreadList allowNsfw={allowNsfw} section="popular" filter={filter} page={page} />
        </HydrationBoundary>
    )

}

export default PopularThreadsPage;