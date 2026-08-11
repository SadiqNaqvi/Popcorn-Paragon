"use client";

import { AddIcon } from "@assets/Icons";
import { GenericWrapper, Navbar } from "@components";
import { Button, OptionalChildren } from "@components/ui";
import { UserBarSkeletonList } from "@components/ui/loading";
import { SimpleUserBar } from "@components/ui/UserBar";
import { shelfCollaboratorsLimit } from "@lib/shared/constants";
import { getCollaboratorsOfShelf } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import { ShelfCollaborators } from "@type/internal";
import { TypedFunction } from "@type/other";
import { useState } from "react";
import { InviteCollaborators, RemoveCollaborators } from "./EditCollaborators";

type Props = { sid: string, uid: string }

type Section = "collaborator" | "remove" | "invite";

const CollaboratorsNavbar = ({ total, setSection }: { total: number, setSection: TypedFunction<Section> }) => {
    return (
        <Navbar
            navTitle="Manage Collaborators"
            className="border-b border-gray30"
            OptionButton={(
                <div className="flex gap-2">
                    <OptionalChildren condition={!!total}>
                        <Button
                            id="remove-collaborators-button"
                            title="Remove Collaborators"
                            onClick={() => setSection("remove")}
                        >
                            Remove
                        </Button>
                    </OptionalChildren>
                    <OptionalChildren condition={shelfCollaboratorsLimit - total}>
                        <Button
                            id="invite-collaborators-button"
                            title="Invite Collaborators"
                            onClick={() => setSection("invite")}
                        >
                            <AddIcon className="size-5" />
                        </Button>
                    </OptionalChildren>
                </div>
            )}
        />
    )
}

const ShowCollaborators = ({ setSection, total }: { total: ShelfCollaborators["collaborators"], setSection: TypedFunction<Section> }) => {

    const collaborators = total.filter(u => u.type === "collaborator");
    const invitees = total.filter(u => u.type === "invitee");

    if (total.length) return (
        <>
            <CollaboratorsNavbar
                total={total.length}
                setSection={setSection}
            />

            <section className="space-y-4">

                <div>
                    <h4 className="text-sm uppercase">Collaborators</h4>
                    <OptionalChildren condition={collaborators.length} fallback={(
                        <div className="my-4">
                            <p className="text-center">No Collaborators Yet</p>
                        </div>
                    )}>
                        <ul className="space-y-4">
                            {collaborators.map(c => (
                                <li key={c.user_id}>
                                    <SimpleUserBar _id={c.user_id} {...c} />
                                </li>
                            ))}
                        </ul>
                    </OptionalChildren>
                </div>

                <div>
                    <h4 className="text-sm uppercase">Invitees</h4>
                    <OptionalChildren condition={invitees.length} fallback={(
                        <div className="my-4">
                            <p className="text-center">No Invited Users</p>
                        </div>
                    )}>
                        <ul className="space-y-4">
                            {invitees.map(c => (
                                <li key={c.user_id}>
                                    <SimpleUserBar _id={c.user_id} {...c} />
                                </li>
                            ))}
                        </ul>
                    </OptionalChildren>
                </div>

            </section>
        </>
    )

    return (
        <div>
            <CollaboratorsNavbar
                total={total.length}
                setSection={setSection}
            />
            <section className="forceCenter">
                <h3 className="w-full text-center">No collaborators</h3>
            </section>
        </div>
    )
}

const Component = (data: ShelfCollaborators, { sid, uid }: Props) => {

    const [section, setSection] = useState<Section>("collaborator");

    const handleBack = () => setSection("collaborator");

    if (section === "remove") return (
        <RemoveCollaborators
            back={handleBack}
            total={data.collaborators}
            sid={sid}
            uid={uid}
        />
    )

    else if (section === "invite") return (
        <InviteCollaborators
            back={handleBack}
            total={data.collaborators}
            sid={sid}
            uid={uid}
        />
    )

    return <ShowCollaborators total={data.collaborators} setSection={setSection} />
}

const CollaboratorSection = ({ sid, uid }: Props) => {

    return (
        <GenericWrapper
            component={Component}
            loadingComponent={<UserBarSkeletonList count={12} />}
            getQueryProps={() => ({
                args: [uid, sid],
                queryFn: getCollaboratorsOfShelf,
                queryKeys: getQueryKeys("shelfCollaborators_sid", { sid })
            })}
            props={{ sid, uid }}
        />
    )
}

export default CollaboratorSection;