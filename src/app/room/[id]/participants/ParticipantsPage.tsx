"use client";

import { CheckIcon } from "@assets/Icons";
import { InfiniteScroller, ListSelector, ListSelectorRef, Navbar } from "@components";
import { Button, UserBar } from "@components/ui";
import { getParticipantsOfRoom, searchFollowers } from "@lib/shared/helpers/internal_fetchers";
import { inviteParticipants, removeParticipants } from "@lib/frontend/helpers/mutations";
import { getQueryKeys } from "@lib/shared/utils";
import { ParticipantEnumType } from "@type/internal";
import { TypedFunction } from "@type/other";
import { useRef, useState } from "react";

type Sections = "list" | "removing" | "inviting";
type Props = { rmid: string, uid: string }

const InviteSection = ({ rmid, uid }: Props & { back: TypedFunction }) => {

    const callbackRef = useRef<ListSelectorRef>(null);
    const handleInvitation = () => {
        const participants = callbackRef.current?.();
        if (!participants || !participants.length) return;
        inviteParticipants(rmid, uid, participants);
    }

    return (
        <section className="flex-1">
            <Navbar
                navTitle="Invite Participants"
                OptionButton={
                    <Button
                        id="submit-button"
                        title="Invite"
                        onClick={handleInvitation}
                    >
                        <CheckIcon />
                    </Button>
                }
            />
            <ListSelector
                mode="search"
                callbackRef={callbackRef}
                className="px-2"
                queryKeys={(query) => getQueryKeys("search-followers_uid_query", { uid, query })}
                queryFn={(q, p) => searchFollowers(q, uid, p)}
                refiner={(user) => ({
                    id: user._id,
                    title: user.username,
                    poster: user.profile,
                })}
            />
        </section>
    )

}

const RemoveSection = ({ rmid, uid }: Props & { back: TypedFunction }) => {

    const callbackRef = useRef<ListSelectorRef>(null);

    const handleRemoval = () => {
        const participants = callbackRef.current?.();
        if (!participants || !participants.length) return;
        removeParticipants(rmid, uid, participants);
    }

    return (
        <>
            <Navbar
                navTitle="Remove Participants"
                OptionButton={
                    <Button
                        id="submit-button"
                        title="Remove"
                        onClick={handleRemoval}
                    >
                        <CheckIcon />
                    </Button>
                }
            />
            <ListSelector
                mode="infinite"
                callbackRef={callbackRef}
                queryFnForList={(p) => getParticipantsOfRoom(uid, rmid, p)}
                queryKeysForList={getQueryKeys("participantsOfRoom_rmid_uid", { rmid, uid })}
                refiner={(user) => ({
                    id: user._id,
                    title: user.username,
                    poster: user.profile,
                })}
            />
        </>
    )

}

const ParticipantsPage = ({ rmid, uid, participantType }: Props & { participantType: ParticipantEnumType }) => {

    const [section, setSection] = useState<Sections>("list");

    const handleBack = () => setSection("list");

    if (section === "inviting") return (
        <InviteSection back={handleBack} rmid={rmid} uid={uid} />
    )

    else if (section === "removing" && participantType === "creator") return (
        <RemoveSection back={handleBack} rmid={rmid} uid={uid} />
    )

    return (
        <>
            <Navbar navTitle="Participants" />
            <InfiniteScroller
                Component={UserBar}
                fetchData={(p) => getParticipantsOfRoom(uid, rmid, p)}
                queryKeys={getQueryKeys("participantsOfRoom_rmid_uid", { rmid, uid })}
            />
        </>
    )
}

export default ParticipantsPage;