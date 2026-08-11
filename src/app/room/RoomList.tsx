"use client";

import { AddIcon, SearchIcon } from "@assets/Icons";
import { Navbar, Navigate } from "@components";
import { ShowError } from "@components/fallbacks";
import RoomBarSheet from "@components/sheets/RoomBarSheet";
import { RoomBarListSkeleton } from "@components/ui/loading";
import { RichRoomBar } from "@components/ui/RoomBar";
import { getInvitedRoomsCount, getRooms } from "@lib/shared/helpers/internal_fetchers";
import { useInfiniteQueryHook, useQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import useOfflineStore from "@store/offlineStore";
import useRoomStore from "@store/roomStore";
import useCurrentUser from "@store/user";
import { InfiniteQueryResponse, MereRoomType } from "@type/internal";
import { useParams } from "next/navigation";
import React, { PropsWithChildren, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import CreateGroup from "./CreateGroup";
import InvitationRoomsList from "./InvitationRoomList";
import RoomSearchList from "./RoomSearchList";
import { Button } from "@components/ui";

const InvitationsCount = ({ uid }: { uid: string }) => {
    const { data } = useQueryHook({
        queryFn: () => getInvitedRoomsCount(uid),
        queryKeys: getQueryKeys("roomInvitationsCount_uid", { uid }),
    });

    if (!data || Math.max(0, data) === 0) return "Invitations"

    return `Invitations ${data}`
}

type RoomListProps = { uid: string };

const RoomListHeader = ({ uid }: RoomListProps) => (
    <>
        <Navbar
            OptionButton={(
                <div className="flex gap-3">
                    <Navigate
                        goto="/room/search"
                        comp="link"
                        className="p-2 rounded-full bg-gray10 border border-gray20 flex">
                        <SearchIcon className="size-4" />
                    </Navigate>
                    <Navigate
                        goto="/room/create"
                        comp="link"
                        className="rounded-full p-2 bg-gray10 border border-gray20 flex">
                        <AddIcon className="size-4" />
                    </Navigate>
                </div>
            )}
            navTitle="Inbox"
            className="px-2"
        />
        <header className="px-2 mt-4 flex flex-cntr-between">
            <h2>Rooms</h2>
            <Navigate className="text-sm no-underline" comp="link" goto="/room/invitations">
                <InvitationsCount uid={uid} />
            </Navigate>
        </header>
    </>
)

const RoomsList = ({ uid }: RoomListProps) => {

    const qkeys = getQueryKeys("rooms_uid", { uid });
    const setRooms = useRoomStore.getState().setRooms;
    const { isHydrated, dataSaver } = useCurrentUser();
    const [roomList, setRoomList] = useOfflineStore<InfiniteQueryResponse<any> | undefined>(qkeys, undefined);
    const container = useRef<HTMLDivElement>(null);

    const { data, isError, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useInfiniteQueryHook<MereRoomType>({
        queryFn: (p) => getRooms(uid, p),
        onSuccess: (response) => {
            const { pages, pageParams } = response;

            const [firstPage] = pages;
            setRooms(pages.flatMap(page => page.results));

            if (pageParams.length === 1 && pageParams[0] === 1)
                setRoomList(firstPage);
        },
        queryKeys: qkeys,
        placeholderData: roomList ? {
            ...roomList,
            results: roomList.results.map(el => el.room_id)
        } : undefined,
        initialPage: 1,
    });

    useEffect(() => {
        if (!isHydrated || dataSaver) return;

        const current = container.current;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isFetchingNextPage && hasNextPage)
                fetchNextPage();
        }, { threshold: 0.1 })

        if (current && hasNextPage) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        }
    }, [dataSaver, isHydrated]);

    const rooms = React.useMemo(() => {
        return Array.from(new Set(data?.pages?.flatMap(result => result.results)
            .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
            .map(r => r.room_id)));
    },
        [data]);

    const manuallyLoadNextPage = () => {
        fetchNextPage();
    }

    if (isLoading) return (
        <>
            <RoomListHeader uid={uid} />
            <RoomBarListSkeleton count={12} />
        </>
    )

    else if (isError) return (
        <>
            <RoomListHeader uid={uid} />

            <ShowError
                retry={refetch}
                heading="Unable to fetch the resource you're looking for"
            />
        </>
    )

    else if (!rooms.length) return (
        <>
            <RoomListHeader uid={uid} />
            <div className="flex-1 flex flex-col flex-cntr-all space-y-2">
                <h2>No rooms yet</h2>
                <p>Click on the + icon and start chatting</p>
            </div>
        </>
    )

    return (
        <>
            <RoomListHeader uid={uid} />

            <section className="mt-2 px-2">
                <ul>
                    {rooms.map(rmid => (
                        <li key={rmid}>
                            <RichRoomBar room_id={rmid} />
                        </li>
                    ))}
                </ul>
                {hasNextPage &&
                    ((isHydrated && !dataSaver) || isFetchingNextPage ?
                        <div ref={container} className="mt-4 py-2">
                            <RoomBarListSkeleton />
                        </div>
                        :
                        <div className="w-full flex flex-cntr-all">
                            <Button
                                id="load-more-button"
                                title="Load More"
                                className="primary"
                                onClick={manuallyLoadNextPage}
                            >
                                Load More
                            </Button>
                        </div>
                    )
                }

            </section>

            <RoomBarSheet />
        </>
    )
}

const RoomListWrapper = ({ id, children }: PropsWithChildren<{ id: string | string[] | undefined }>) => {
    const shouldHide = !(!id || id === "create" || id === "search" || id === "invitations")
    return (
        <div className={twMerge("md:border-r border-gray20 w-full flex flex-col md:max-w-96 border-right border-gray30 overflow-y-auto", shouldHide ? "hidden md:block" : '')}>
            {children}
        </div>
    )
}

const RoomListSection = ({ uid }: { uid: string }) => {

    const { id } = useParams();

    if (id === "invitations") return (
        <RoomListWrapper id={id}>
            <InvitationRoomsList uid={uid} />
        </RoomListWrapper>
    )

    else if (id === "search") return (
        <RoomListWrapper id={id}>
            <RoomSearchList uid={uid} />
        </RoomListWrapper>
    )

    else if (id === "create") return (
        <RoomListWrapper id={id}>
            <CreateGroup />
        </RoomListWrapper>
    )

    return (
        <RoomListWrapper id={id}>
            <RoomsList uid={uid} />
        </RoomListWrapper>
    )

}

export default RoomListSection;