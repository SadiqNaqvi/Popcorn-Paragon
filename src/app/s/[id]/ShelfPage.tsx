"use client";

import { FilterTiles, GenericWrapper, InfiniteScroller, Navigate, ObserverHeader } from "@components";
import { MetadataTile, MetadataTileContainer, ShelfItemBar, ShelfPoster } from "@components/ui";
import { getItems, getShelf } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys, timeAgo } from "@lib/shared/utils";
import { FullShelf } from "@type/internal";
import ActionButton from "./ActionButton";
import EllipsisButton from "./Ellipsis";
import { ShelfBarListSkeleton, ShelfPageSkeleton } from "@components/ui/loading";

type Props = {
    id: string,
    filter: string,
    page: number,
    uid: string | undefined,
    key: string | undefined,
}

const getQueryProps = ({ id, key, uid }: Props) => ({
    queryKeys: getQueryKeys("shelf_sid", { sid: id }),
    queryFn: getShelf,
    args: [id, uid, key],
});

const Component = (data: FullShelf, { filter, page, uid, key }: Props) => {

    const { _id, createdAt, isPrivate, item_count, shelfKey, last_added, shelf_type, name, poster, saved_count, user_id, username } = data;

    return (
        <>
            <ObserverHeader
                titleToShare={`Check out this Shelf "${name}" by ${username} - Parlocula`}
                urlToShare={`/s/${_id}${shelfKey ? `?k=${shelfKey}` : ''}`}
                OptionButton={<EllipsisButton isPrivate={isPrivate} author={user_id} id={_id} />}
                navTitle={name}
                className="pb-4 border-b border-gray30 px-2">

                <section className="flex gap-2 sm:gap-4 items-center">
                    <ShelfPoster
                        fancy
                        bigSize
                        name={name}
                        poster={poster}
                        shelf_type={shelf_type}
                    />

                    <div>
                        <h1 data-observe className="selectable text-lg sm:text-2xl capitalize font-semibold">{name}</h1>
                        <p className="text-sm ghostColor space-x-1">
                            <span>Created by:</span>
                            <Navigate goto={`/u/${username}`} comp="link">{username}</Navigate>
                        </p>
                    </div>
                </section>

                <div className="space-y-4 my-4">
                    <MetadataTileContainer>
                        <MetadataTile>{timeAgo(createdAt)}</MetadataTile>
                        <MetadataTile>{item_count} items</MetadataTile>
                        <MetadataTile condition={Boolean(saved_count)}>Saved by: {saved_count}</MetadataTile>
                        <MetadataTile condition={Boolean(last_added)}>Last Added: {timeAgo(last_added)}</MetadataTile>
                    </MetadataTileContainer>
                </div>

                <ActionButton
                    cuid={uid}
                    saved_count={saved_count}
                    author={user_id}
                    id={_id}
                    isPrivate={isPrivate}
                    shelf_type={shelf_type}
                />

            </ObserverHeader>

            <div className="my-2 px-2">
                <FilterTiles type="items" />
            </div>

            <InfiniteScroller
                className="mt-6 space-y-4 px-2"
                Component={ShelfItemBar}
                Loading={<ShelfBarListSkeleton count={12} />}
                queryKeys={getQueryKeys("itemsOfShelf_sid_filter", { sid: _id, filter })}
                fetchData={(p) => getItems(_id, uid, p, filter, key)}
                initialPage={page}
            />
        </>
    )
}

const ShelfPage = (props: Props) => (
    <GenericWrapper
        component={Component}
        getQueryProps={getQueryProps}
        props={props}
        loadingComponent={<ShelfPageSkeleton />}
    />
)


export default ShelfPage;