"use client";

import { InfiniteScroller } from "@components";
import { PostBar, SearchTile, ShelfBar, ThreadTile, UserBar } from "@components/ui";
import { PostListSkeleton, SearchResultSkeletonList, ShelfBarListSkeleton, ThreadListSkeleton, UserBarSkeletonList } from "@components/ui/loading";
import { searchFilters } from "@lib/shared/constants";
import useCurrentUser from "@store/user";
import { useSearchParams } from "next/navigation";
import SearchHeader from "./SearchHeader";
import SearchHistorySection from "./SearchHistorySection";
import { getQueryFnForSearch } from "./utils";

const LoadingSkeleton = ({ currentFilter }: { currentFilter: string }) => {
    if (currentFilter === "posts") return <PostListSkeleton />;
    else if (currentFilter === "threads") return <ThreadListSkeleton count={10} />;
    else if (currentFilter === "shelves") return <ShelfBarListSkeleton count={10} />;
    else if (currentFilter === "users") return <UserBarSkeletonList count={10} />;
    else return <SearchResultSkeletonList count={10} />;
}

const ComponentToShow = ({ currentFilter, doc }: { currentFilter: string, doc: any }) => {

    if (currentFilter === "posts") return <PostBar {...doc} />;
    else if (currentFilter === "threads") return <ThreadTile {...doc} />;
    else if (currentFilter === "shelves") return <ShelfBar {...doc} />;
    else if (currentFilter === "users") return <UserBar {...doc} />;
    else return <SearchTile {...doc} />;
}

const SearchPage = () => {
    const params = useSearchParams();
    const searchQuery = params.get('q') || '';
    const filter = params.get('f');
    const currentFilter = filter && searchFilters.includes(filter) ? filter : searchFilters[0];

    const { filterContent, isHydrated } = useCurrentUser();

    const notFoundMessage = {
        title: `Nothing can be found with '${searchQuery}'`,
        paras: ["Change the query or filter and try again."]
    }

    const queryFn = async (p: number) => {
        const func = getQueryFnForSearch(currentFilter, !filterContent);
        return await func(searchQuery, p);
    }

    if (searchQuery.trim()) return (
        <>
            <SearchHeader filter={currentFilter} />

            <section className="mt-6 px-4">
                <InfiniteScroller
                    notFoundMessage={notFoundMessage}
                    Loading={<LoadingSkeleton currentFilter={currentFilter} />}
                    Component={(doc) => <ComponentToShow currentFilter={currentFilter} doc={doc} />}
                    queryKeys={["search", searchQuery, `filter-${currentFilter}`]}
                    fetchData={queryFn}
                    enabled={isHydrated}
                />
            </section>

        </>
    );

    return (
        <>
            <SearchHeader filter={currentFilter} />
            <SearchHistorySection />
        </>
    );
}

export default SearchPage;