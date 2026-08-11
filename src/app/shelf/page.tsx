import { getPopularShelves } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import ShelfHomePage from "./ShelfHomePage";

const ShelfPage = async ({ searchParams }: ParloPageProps) => {

    const sp = await searchParams;

    const page = Number(sp.p) || 1;

    const queryClient = getQueryClient();

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getPopularShelves(page),
        queryKey: getQueryKeys("popularShelves", {})
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ShelfHomePage />
        </HydrationBoundary>
    )

}

export default ShelfPage;