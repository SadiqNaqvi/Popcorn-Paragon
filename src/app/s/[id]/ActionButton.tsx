"use client";

import { EditIcon } from "@assets/Icons";
import { Navigate, SaveButton } from "@components";
import { getShelfConnection } from "@lib/shared/helpers/internal_fetchers";
import { acceptCollaboratorInvitation, rejectCollaboratorInvitation } from "@lib/frontend/helpers/mutations";
import { useQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import { AllShelves } from "@type/models";
import AddItemsButton from "./AddItemsButton";
import { Button } from "@components/ui";

type Props = {
    id: string;
    isPrivate: boolean,
    author: string,
    cuid: string | undefined,
    saved_count: number | undefined,
    shelf_type: AllShelves,
}

const SaveShelfButton = ({ isPrivate, saved_count, id, cuid, author }: Omit<Props, "shelf_type">) => {
    if (!isPrivate) return (
        <SaveButton
            author={author}
            uid={cuid}
            count={saved_count}
            type="Shelf"
            id={id}
            className="secondary gap-2 col-span-4 sm:col-span-1"
        />
    )
}

const CheckShelfConnection = ({ uid, sid, shelf_type }: { uid: string, sid: string, shelf_type: AllShelves }) => {

    const { data } = useQueryHook({
        queryFn: () => getShelfConnection(uid, sid),
        queryKeys: getQueryKeys("shelfConnection_sid", { sid }),
    });

    const acceptInvitation = () => {
        acceptCollaboratorInvitation(sid);
    }

    const rejectInvitation = () => {
        rejectCollaboratorInvitation(sid);
    }

    if (data?.type === "collaborator") return (
        <AddItemsButton shelf_type={shelf_type} sid={sid} uid={uid} />
    )

    else if (data?.type === "invitee") return (
        <>
            <div className="contents">
                <Button
                    id="accept-invitation-button"
                    title="Accept"
                    className="primary"
                    onClick={acceptInvitation}
                >
                    Accept
                </Button>
                <Button
                    id="reject-invitation-button"
                    title="Reject"
                    className="secondary"
                    onClick={rejectInvitation}
                >
                    Reject
                </Button>
            </div>
            <p className="text-xs sm:text-sm ghostColor text-center col-span-2 sm:col-span-4 row-start-3">
                You{"'"}re invited to become a collaborator of this shelf
            </p>
        </>
    )

}

const sectionClassName = "grid gap-2 grid-cols-2 sm:grid-cols-4";

const ActionButton = ({ isPrivate, cuid, author, id, saved_count, shelf_type }: Props) => {

    if (cuid === author) return (
        <section className={sectionClassName}>
            <AddItemsButton shelf_type={shelf_type} uid={cuid} sid={id} className="col-span-2 sm:col-span-1" />
            <Navigate
                className="btn secondary gap-2"
                type="button"
                comp="link"
                goto={`/s/${id}/edit`}>
                <EditIcon />
                <span>Edit</span>
            </Navigate>
            <Navigate
                className="btn secondary"
                comp="link"
                goto={`/s/${id}/collaborators`}
                type="button"
            >
                Manage
            </Navigate>

        </section>
    )

    else if (cuid) return (
        <section className={sectionClassName}>
            <CheckShelfConnection shelf_type={shelf_type} sid={id} uid={cuid} />
            <SaveShelfButton author={author} isPrivate={isPrivate} saved_count={saved_count} id={id} cuid={cuid} />
        </section>
    )

    return <SaveShelfButton author={author} isPrivate={isPrivate} saved_count={saved_count} id={id} cuid={cuid} />
}

export default ActionButton;