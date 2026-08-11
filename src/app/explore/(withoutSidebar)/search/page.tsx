import { getUserFromToken } from "@lib/backend/utils";
import { searchFilters } from "@lib/shared/constants";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import SearchPage from "./SearchPage";
import { getQueryFnForSearch } from "./utils";

export const metadata = generateDynamicMetadata({ 
    title: "Search",
    allowRobots: true
});

const Page = async ({ searchParams }: ParloPageProps) => {

    const params = await searchParams;
    const searchQuery = params.q || '';
    const filter = params.f;
    const page = Number(params.p) || 1;
    const currentFilter = filter && searchFilters.includes(filter) ? filter : searchFilters[0];

    const user = await getUserFromToken(await cookies());

    const queryFn = async () => {
        const func = getQueryFnForSearch(currentFilter, !(user?.filterContent ?? true));
        return await func(searchQuery, page);
    }

    const queryClient = getQueryClient();

    if (searchQuery.trim()) {
        await prefetchInfiniteQuery({
            queryClient,
            queryFn,
            queryKey: ["search", searchQuery, `filter-${currentFilter}`],
        });
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SearchPage />
        </HydrationBoundary>
    );
}

export default Page;