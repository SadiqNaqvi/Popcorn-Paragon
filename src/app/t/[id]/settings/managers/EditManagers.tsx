"use client";

import { ListSelector, ListSelectorRef, Navbar } from "@components";
import { RefinedValues } from "@components/ListSelector";
import { Button } from "@components/ui";
import { threadManagersLimit } from "@lib/shared/constants";
import { getMembers, searchMembers } from "@lib/shared/helpers/internal_fetchers";
import { inviteManagersMutation, removeManagersMutation } from "@lib/frontend/helpers/mutations";
import { getQueryKeys } from "@lib/shared/utils";
import { UserMetaData } from "@store/user";
import { MereUser, ModeratorType } from "@type/internal";
import { TypedFunction } from "@type/other";
import { useRef } from "react";

type Props = {
    back: TypedFunction,
    uid: string,
    tid: string,
}

const refiner = (user: MereUser | UserMetaData): RefinedValues => {

    if ("_id" in user) return {
        title: user.username,
        id: user._id,
        poster: user.profile,
        returnVal: user
    }
    else return {
        title: user.username,
        id: user.user_id,
        poster: user.profile,
    }
}

export const RemoveManagers = ({ back, tid, managers, uid }: Props & { managers: ModeratorType[] }) => {

    const callbackRef = useRef<ListSelectorRef>(null);

    const handleRemoval = () => {
        const users = callbackRef.current?.();
        if (!users || !users.length) return;
        removeManagersMutation(tid, uid, { users });
        back();
    }

    return (
        <>

            <Navbar
                navTitle="Remove Managers"
                onGoBack={back}
                OptionButton={
                    <Button
                        id="remove-managers-submit-button"
                        title="Remove"
                        className="primary"
                        onClick={handleRemoval}
                    >
                        Remove
                    </Button>
                }
            />

            <section className="space-y-4">
                <ListSelector
                    mode="static-refiner"
                    data={managers}
                    callbackRef={callbackRef}
                    className="mt-4"
                    frameType="userProfile"
                    returnIds
                    refiner={refiner}
                />
            </section>
        </>
    )
}

export const InviteManagers = ({ back, uid, tid, managersCount }: Props & { managersCount: number }) => {

    const callbackRef = useRef<ListSelectorRef<MereUser>>(null);

    const handleSubmit = () => {
        const users = callbackRef.current?.() ?? [];
        if (!users.length) return;

        inviteManagersMutation(
            tid,
            uid,
            users.map(user => ({
                username: user.username,
                user_id: user._id,
                profile: user.profile,
                role: "moderator_invitee",
            })),
        );

        back();
    }

    return (
        <>
            <Navbar
                navTitle="Invite Managers"
                onGoBack={back}
                OptionButton={(
                    <Button
                        id="invite-managers-submit-button"
                        title="Invite"
                        className="primary"
                        onClick={handleSubmit}
                    >
                        Invite
                    </Button>
                )}
            />

            <section className="px-2">
                <ListSelector
                    mode="search"
                    queryFn={(q, p) => searchMembers(tid, q, p)}
                    queryKeys={(query) => getQueryKeys("searchMembers_tid_query", { tid, query })}
                    queryFnForList={(p) => getMembers(tid, p)}
                    queryKeysForList={getQueryKeys("members_tid", { tid })}
                    callbackRef={callbackRef}
                    inputPlaceholder="Search Members"
                    className="mt-4"
                    frameType="userProfile"
                    refiner={refiner}
                    limit={threadManagersLimit - managersCount}
                />
            </section>
        </>
    )

}