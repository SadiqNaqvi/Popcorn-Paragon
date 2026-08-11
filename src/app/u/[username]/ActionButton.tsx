import { BellIcon, BellSlashIcon } from "@assets/Icons";
import { BottomSheetRef, Navigate, OptionMenu, UserBasedButton, UserBasedButtonProps } from "@components";
import { Button } from "@components/ui";
import OptionList from "@components/ui/OptionList";
import { checkUserConnection } from "@lib/shared/helpers/internal_fetchers";
import { AvailableMutations } from "@lib/frontend/providers/mutationStore";
import { getQueryKeys } from "@lib/shared/utils";
import { UserConnectionType } from "@type/internal";
import { useRef } from "react";
import { toast } from "sonner";

type Props = {
    rid: string,
    uid: string | undefined,
    username: string;
}

const primaryButtonClassName = "flex-1 sm:flex-none primary";
const secondaryButtonClassName = "flex-1 sm:flex-none secondary";

const ActionButton = ({ rid, uid, username }: Props) => {

    const sheetRef = useRef<BottomSheetRef>(null);

    if (rid === uid) return (
        <>
            <Navigate
                className="primary btn w-full sm:w-fit"
                role="button"
                goto="/settings/edit"
                comp="link">
                Edit Profile
            </Navigate>
            <Navigate
                className="secondary btn w-full sm:w-fit"
                role="button"
                goto="/settings"
                comp="link">
                Settings
            </Navigate>
        </>
    )

    const ResponsiveButton = ({ user_id, onClick, state }: UserBasedButtonProps<UserConnectionType>) => {

        if (!state || state.isBlocked) return (
            <Button
                id="disabled-follow-button"
                title="Follow"
                className={primaryButtonClassName}
                onClick={() => toast("Uh Oh! Something went wrong")}
            >
                Follow
            </Button>
        )

        const handleClick = (action: AvailableMutations) => {
            if (action === "update_user_notification")
                onClick({ ...state, follows: true }, action, [user_id, rid, { notification: !state.notification }])
            else {
                let newState = state;

                if (action === "block_user")
                    newState = { ...state, haveBlocked: true }
                else if (action === "unblock_user")
                    newState = { ...state, haveBlocked: false, follows: false }
                else if (action === "unfollow_user")
                    newState = { ...state, haveBlocked: false, follows: false }
                else if (action === "follow_user")
                    newState = { ...state, follows: true }
                else if (action === "remove_follower")
                    newState = { ...state, followBack: true }

                onClick(newState, action, [user_id, rid]);
                sheetRef.current?.close();
            }
        }

        const { followBack, follows, haveBlocked, notification } = state;

        if (haveBlocked) return (
            <Button
                id="unblock-button"
                title="Unblock"
                className={secondaryButtonClassName}
                onClick={() => handleClick("unblock_user")}
            >
                Unblock
            </Button>
        )

        else if (!follows) return (
            <Button
                id="follow-button"
                title={followBack ? "Follow back" : "Follow"}
                className={primaryButtonClassName}
                onClick={() => handleClick("follow_user")}
            >
                {followBack ? "Follow back" : "Follow"}
            </Button>
        )

        else return (
            <>
                <OptionMenu
                    buttonTitle="View Options"
                    sheetRef={sheetRef}
                    ButtonElement={<>Unfollow {notification ? <BellIcon /> : <BellSlashIcon />}</>}
                    className={secondaryButtonClassName}
                >
                    <OptionList onClick={() => handleClick("unfollow_user")}>Unfollow</OptionList>
                    <OptionList onClick={() => handleClick("block_user")}>Block</OptionList>
                    <OptionList onClick={() => handleClick("remove_follower")}>Remove Follower</OptionList>
                    <OptionList onClick={() => handleClick("update_user_notification")}>{notification ? "Disable" : "Enable"} Notification</OptionList>
                </OptionMenu>
            </>
        )
    }

    return (
        <UserBasedButton
            buttonTitle="Follow"
            Button={ResponsiveButton}
            noUserStateChilren="Follow"
            redirectAfterLogin={`/u/${username}`}
            noUserStateClassName={primaryButtonClassName}
            uid={uid}
            queryFn={(uid) => checkUserConnection(uid, rid)}
            queryKeys={getQueryKeys("connection_ruid", { ruid: rid })}
        />
    )
}

export default ActionButton;