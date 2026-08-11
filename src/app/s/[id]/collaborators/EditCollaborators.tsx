"use client";

import { Navbar } from "@components";
import ListSelector, { ListSelectorRef, RefinedValues } from "@components/ListSelector";
import { Button } from "@components/ui";
import { shelfCollaboratorsLimit } from "@lib/shared/constants";
import { getFollowers, searchFollowers } from "@lib/shared/helpers/internal_fetchers";
import { inviteCollaboratorsMutation, removeCollaboratorsMutation } from "@lib/frontend/helpers/mutations";
import appToast from "@lib/frontend/providers/appToast";
import { getQueryKeys } from "@lib/shared/utils";
import { UserMetaData } from "@store/user";
import { MereUser } from "@type/internal";
import { TypedFunction } from "@type/other";
import { useRef } from "react";

type Props = { sid: string, uid: string, total: UserMetaData[], back: TypedFunction }

const refiner = (user: MereUser | UserMetaData): RefinedValues => {

    if ("user_id" in user) return {
        title: user.username,
        id: user.user_id,
        poster: user.profile,
    }
    else return {
        title: user.username,
        id: user._id,
        poster: user.profile,
        returnVal: user
    }
}

export const RemoveCollaborators = ({ back, total, sid, uid }: Props) => {

    const callbackRef = useRef<ListSelectorRef>(null);

    const handleRemoval = () => {
        const users = callbackRef.current?.();
        if (!users || !users.length) return;
        removeCollaboratorsMutation(sid, uid, { users });
        back();
    }

    return (
        <div>
            <Navbar
                navTitle="Remove Collaborators"
                onGoBack={back}
                OptionButton={
                    <Button
                        id="remove-collaborators-submit-button"
                        title="Remove Selected Collaborators"
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
                    data={total}
                    callbackRef={callbackRef}
                    returnIds
                    refiner={refiner}
                />
            </section>
        </div>
    )
}

export const InviteCollaborators = ({ uid, back, total, sid }: Props) => {

    const inviteesRef = useRef<ListSelectorRef<MereUser>>(null);

    const handleSubmit = async () => {
        const invitees = inviteesRef.current?.();

        if (!invitees || !invitees.length)
            return appToast.error("At least one user should be selected to invite")

        inviteCollaboratorsMutation(sid, invitees.map(({ _id, username, profile }) => ({ user_id: _id, username, profile, type: "invitee" })));
        back();
    }

    return (
        <div className="space-y-4">
            <Navbar
                navTitle="Invite Collaborators"
                onGoBack={back}
                OptionButton={
                    <Button
                        id="invite-collaborators-submit-button"
                        title="Invite Selected Users"
                        className="primary"
                        onClick={handleSubmit}
                    >
                        Invite
                    </Button>
                }
            />

            <section className="px-4">
                <ListSelector
                    mode="search"
                    queryFn={(q, p) => searchFollowers(q, uid, p)}
                    queryKeys={q => getQueryKeys("search-followers_uid_query", { uid, query: q })}
                    queryFnForList={(p) => getFollowers(uid, p)}
                    queryKeysForList={getQueryKeys("followersOfCurrentUser_uid", { uid })}
                    disabledValues={total.map(u => u.user_id)}
                    callbackRef={inviteesRef}
                    inputPlaceholder="Search your followers"
                    refiner={refiner}
                    limit={shelfCollaboratorsLimit - total.length}
                />
            </section>
        </div>
    )
}