"use client";

import { BellIcon, BellSlashIcon } from "@assets/Icons";
import { Navigate, OptionMenu, UserBasedButton, UserBasedButtonProps } from "@components";
import { Button } from "@components/ui";
import OptionList from "@components/ui/OptionList";
import { isMember } from "@lib/shared/helpers/internal_fetchers";
import { acceptManagerInvitation, rejectManagerInvitation } from "@lib/frontend/helpers/mutations";
import { AvailableMutations } from "@lib/frontend/providers/mutationStore";
import { getQueryKeys } from "@lib/shared/utils";
import { MereThread, ThreadMembership } from "@type/internal";
import { toast } from "sonner";

const RoleBasedActionButtons = ({ role, tid }: { tid: string, role: ThreadMembership["role"] }) => {

    if (role === "member") return;

    const acceptInvite = () => {
        acceptManagerInvitation(tid);
    }

    const rejectInvite = () => {
        rejectManagerInvitation(tid);
    }

    if (role === "moderator_invitee") return (
        <>
            <div className="contents">
                <Button
                    id="moderator-invitation-accept-button"
                    title="Accept Invitation"
                    onClick={acceptInvite}
                    className="primary"
                >
                    Accept
                </Button>
                <Button
                    id="moderator-invitation-reject-button"
                    title="Reject Invitation"
                    onClick={rejectInvite}
                    className="secondary"
                >
                    Reject
                </Button>
            </div>
            <p className="text-sm ghostColor col-span-2 sm:col-span-4 text-center">You are invited to become a Manager of this thread.</p>
        </>
    )

    else if (role === "moderator") return (
        <Navigate comp="link" type="button" goto={`/t/${tid}/settings`} className="btn secondary col-span-2 sm:col-span-1">
            Settings
        </Navigate>
    )

}

const className = "primary w-full sm:w-fit";

const JoinButton = ({ thread, uid }: { thread: MereThread, uid?: string }) => {

    const ResponsiveButton = ({ onClick, state, user_id }: UserBasedButtonProps<ThreadMembership>) => {

        if (state?.banned) return (
            <Button
                id="disabled-join-button"
                title="Join Thread"
                className={className}
                onClick={() => toast.error(" Uh Oh! Something went wrong")}>
                Join
            </Button>
        )

        const handleClick = (action: AvailableMutations) => {
            if (action === "join_thread")
                onClick({ notification: true, role: "member" }, action, [thread._id, user_id]);
            else if (action === "leave_thread")
                onClick(null, action, [thread._id, user_id]);
            else onClick(null, "update_thread_notification", [thread._id, user_id, !state?.notification]);
        }


        if (!state) return (
            <Button
                id="join-button"
                title="Join Thread"
                className={className}
                onClick={() => handleClick("join_thread")}>
                Join
            </Button>
        )

        return (
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                <OptionMenu
                    buttonTitle="View Options"
                    ButtonElement={<>Joined {state.notification ? <BellIcon className="min-w-4" /> : <BellSlashIcon className="min-w-4" />}</>}
                    className="secondary flex-1 sm:flex-0"
                >
                    <OptionList onClick={() => handleClick("leave_thread")}>Leave Thread</OptionList>
                    <OptionList onClick={() => handleClick("update_thread_notification")}>{state.notification ? "Disable" : "Enable"} Notification</OptionList>
                </OptionMenu>

                <Navigate
                    comp="link"
                    goto={`/new/post?tid=${thread._id}`}
                    className="btn secondary flex-1 sm:flex-0"
                >
                    Create Post
                </Navigate>

                <RoleBasedActionButtons role={state.role} tid={thread._id} />
            </div>
        )
    }

    return (
        <UserBasedButton
            buttonTitle="Join thread"
            Button={ResponsiveButton}
            noUserStateChilren="Join"
            noUserStateClassName={className}
            redirectAfterLogin={`/t/${thread._id}`}
            uid={uid}
            queryFn={(user_id) => isMember(thread._id, user_id)}
            queryKeys={getQueryKeys("membership_tid", { tid: thread._id })}
            errorStateClassName="p-2 border border-gray-500 rounded-md"
        />
    )
}

export default JoinButton;