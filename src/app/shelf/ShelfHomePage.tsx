"use client";

import { InfiniteScroller } from "@components";
import { ShelfNavbar } from "@components/TopNavbar";
import { ShelfBar } from "@components/ui";
import { ShelfBarListSkeleton } from "@components/ui/loading";
import { getPopularShelves } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";

const ShelfHomePage = () => {

    return (
        <>
            <ShelfNavbar />

            <section className="mt-4">
                <InfiniteScroller
                    Loading={<ShelfBarListSkeleton count={12} />}
                    Component={ShelfBar}
                    fetchData={(p) => getPopularShelves(p)}
                    queryKeys={getQueryKeys("popularShelves", {})}
                    skipGroupInClassName
                />
            </section>
        </>
    )

}

export default ShelfHomePage;
