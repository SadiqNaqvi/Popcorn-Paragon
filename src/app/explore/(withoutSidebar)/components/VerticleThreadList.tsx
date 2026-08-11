"use client";

import { FilterTiles, InfiniteScroller } from "@components";
import { ThreadTile } from "@components/ui";
import { getThreadsForTaleonOrArtist } from "@lib/shared/helpers/internal_fetchers";
import useCurrentUser from "@store/user";

const VerticleThreadList = ({ id, filter, page }: { id: string, filter: string, page: number }) => {

    const { filterContent } = useCurrentUser();

    return (
        <>
            <header className="flex flex-cntr-between px-2">
                <h1 className="text-xl font-semibold">Threads</h1>
                <FilterTiles type="threads" containerClassName="my-2" />
            </header>
            <section className="mt-4 px-2">
                <InfiniteScroller
                    Component={ThreadTile}
                    fetchData={() => getThreadsForTaleonOrArtist(id, page, !filterContent, filter)}
                    queryKeys={["threads-for-media", id, filter]}
                />
            </section>
        </>
    )

}

export default VerticleThreadList;