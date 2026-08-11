"use client";

import { LeftChevron } from "@assets/Icons";
import { Navbar, SearchInList } from "@components";
import RoomBar from "@components/ui/RoomBar";
import { searchRooms } from "@lib/shared/helpers/internal_fetchers";
import { useSearchParams } from "next/navigation";

const RoomSearchList = ({ uid }: { uid: string }) => {

    const sp = useSearchParams();
    const query = sp.get("q");

    return (
        <>
            <Navbar navTitle="Search Rooms" />
            <section className="px-2">
                <SearchInList
                    Component={RoomBar}
                    initialQuery={query}
                    queryFn={(q, p) => searchRooms(uid, q, p)}
                    queryKeys={(q) => ["search", "rooms", q]}
                />
            </section>
        </>
    )
}

export default RoomSearchList;