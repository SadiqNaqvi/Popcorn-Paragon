"use client";

import { AddIcon, EditIcon } from "@assets/Icons";
import { GenericWrapper, Navbar } from "@components";
import { Button, OptionalChildren } from "@components/ui";
import { SimpleUserBar } from "@components/ui/UserBar";
import { threadManagersLimit } from "@lib/shared/constants";
import { getManagers } from "@lib/shared/helpers/internal_fetchers";
import { useOptionalState } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { ThreadModType } from "@type/internal";
import { TypedFunction } from "@type/other";
import { InviteManagers, RemoveManagers } from "./EditManagers";
import FullPageUserBarSkeleton from "./loading";

type Props = {
    tid: string,
    uid: string
}

const ManagerNavbar = ({ managersCount, isCreator, onInvite, onRemove }: { managersCount: number, isCreator: boolean, onInvite: TypedFunction, onRemove: TypedFunction }) => (
    <Navbar
        navTitle="Manage Managers"
        OptionButton={

            <div className="flex gap-2">
                <OptionalChildren condition={managersCount < threadManagersLimit}>
                    <Button
                        id="add-managers-button"
                        title="Add"
                        onClick={onInvite}
                    >
                        <AddIcon />
                    </Button>
                </OptionalChildren>

                <OptionalChildren condition={isCreator}>
                    <Button
                        id="remove-managers-button"
                        title="Remove"
                        onClick={onRemove}
                    >
                        <EditIcon />
                    </Button>
                </OptionalChildren>
            </div>
        }
    />
)

const Component = (data: ThreadModType, { tid, uid }: Props) => {

    const [section, setSection] = useOptionalState<"show" | "invite" | "remove">("show");
    const threadCreator = data.creator.user_id;
    const managersCount = data.managers?.length || 0;
    const managers = data.managers.filter(u => u.role === "moderator");
    const invitees = data.managers.filter(u => u.role === "moderator_invitee");

    const handleBack = () => setSection("show");

    if (section === "invite") return (
        <InviteManagers back={handleBack} tid={tid} managersCount={managersCount} uid={uid} />
    )

    else if (section === "remove") return (
        <RemoveManagers back={handleBack} tid={tid} uid={uid} managers={data.managers} />
    )

    if (!managersCount) return (
        <>
            <ManagerNavbar
                isCreator={uid === threadCreator}
                onInvite={() => setSection("invite")}
                onRemove={() => setSection("remove")}
                managersCount={managersCount}
            />
            <div className="h-size-screen flex flex-cntr-all px-2">
                <p className="mt-32">No Managers has been chosen yet</p>
            </div>
        </>
    )

    return (
        <>
            <ManagerNavbar
                isCreator={uid === threadCreator}
                onInvite={() => setSection("invite")}
                onRemove={() => setSection("remove")}
                managersCount={managersCount}
            />

            <section className="space-y-4 px-2">

                <div className="space-y-2">
                    <h4 className="uppercase text-sm font-semibold">Managers</h4>
                    <OptionalChildren condition={managers.length} fallback={(
                        <p className="text-center">No Managers Yet</p>
                    )}>
                        <ul className="space-y-3">
                            {managers.map(u => (
                                <li key={u.user_id}>
                                    <SimpleUserBar _id={u.user_id} username={u.username} profile={u.profile} />
                                </li>
                            ))}
                        </ul>
                    </OptionalChildren>
                </div>

                <div className="space-y-2">
                    <h4 className="uppercase text-sm font-semibold">Invitees</h4>
                    <OptionalChildren condition={invitees.length} fallback={(
                        <p className="text-center">No Invitees Yet</p>
                    )}>
                        <ul className="space-y-3">
                            {invitees.map(u => (
                                <li key={u.user_id}>
                                    <SimpleUserBar _id={u.user_id} username={u.username} profile={u.profile} />
                                </li>
                            ))}
                        </ul>
                    </OptionalChildren>
                </div>

            </section>

        </>
    )
}

const Managers = ({ tid }: { tid: string }) => {

    const { meta } = useCurrentUser();
    if (!meta) return null;

    return (
        <GenericWrapper
            component={Component}
            loadingComponent={<FullPageUserBarSkeleton />}
            getQueryProps={({ tid }) => ({
                args: [tid, meta.user_id],
                queryFn: getManagers,
                queryKeys: getQueryKeys("threadManagers_tid", { tid })
            })}
            props={{ tid, uid: meta.user_id }}
            needUser
        />
    )
}

export default Managers;