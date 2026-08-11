"use client";

import { InfiniteScroller, Navbar } from "@components";
import RoomBar from "@components/ui/RoomBar";
import { getInvitedRooms } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";

const NotFoundSection = () => (
    <section className="h-size-screen flex flex-cntr-all pt-8">
        <h2>No Invitations yet</h2>
    </section>
)

const InvitationRoomsList = ({ uid }: { uid: string }) => {

    return (
        <>
            <Navbar
                className="flex items-center px-2"
                navTitle="Invitations"
                hrefToRedirect="/room"
            />
            <section className="px-2">
                <InfiniteScroller
                    Component={RoomBar}
                    fetchData={(p) => getInvitedRooms(uid, p)}
                    queryKeys={getQueryKeys("roomInvitations_uid", { uid })}
                    NotFoundSection={<NotFoundSection />}
                />
            </section>
        </>
    )

}

export default InvitationRoomsList;