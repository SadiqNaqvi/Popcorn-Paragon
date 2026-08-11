"use client";

import { BellIcon, BellSlashIcon, EyeSlashIcon, LeaveIcon, RightChevron, UserIcon } from "@assets/Icons";
import { BottomSheet, Navigate, NestedSheet } from "@components";
import { WarningSheet } from "@components/sheets";
import { Button, OptionalChildren, ParloImage } from "@components/ui";
import { hideRoom, leaveRoom, updateNotificationOfRoom } from "@lib/frontend/helpers/mutations";
import { useDebounce } from "@lib/frontend/hooks";
import { FullRoomType } from "@type/internal";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useState } from "react";

type Props = { rmid: string, uid: string }

const MuteButton = ({ mute, rmid, uid }: { mute: boolean } & Props) => {

    const [isMute, setIsMute] = useState(mute);
    const { mutate, setFinalState } = useDebounce(() => updateNotificationOfRoom(rmid, uid, isMute), {
        initial: mute,
    });

    const debounceMute = () => {
        mutate();
        setFinalState(!isMute);
        setIsMute(!isMute);
    }

    return (
        <Button
            id="mute-button"
            title={`Turn ${isMute ? "on" : "off"} room notifications`}
            onClick={debounceMute}
            className="p-2 flex flex-col gap-2 flex-1 sm:w-fit border border-gray40 rounded-md"
        >
            <OptionalChildren condition={isMute} fallback={(
                <>
                    <BellIcon />
                    <span className="text-sm">Mute</span>
                </>
            )}>
                <BellSlashIcon />
                <span className="text-sm">Unmute</span>
            </OptionalChildren>
        </Button>
    )

}

const LeaveRoomButton = ({ rmid, uid }: Props) => {
    const navigation = useRouter();

    const handleLeave = () => {
        leaveRoom(rmid, uid);
        navigation.replace(`/room/${rmid}`);
    }

    return (
        <NestedSheet
            button={(
                <>
                    <LeaveIcon />
                    <span>Leave</span>
                </>
            )}
            className="p-2 flex gap-2 flex-1 flex-col border border-gray40 rounded-md"
        >
            <WarningSheet
                action="leave this room"
                dangerButton="Leave"
                dangerFunc={handleLeave}
            />
        </NestedSheet>
    )
}

const HideRoomButton = ({ rmid, uid }: Props) => {
    const navigation = useRouter();

    const handleHide = () => {
        hideRoom(rmid, uid);
        navigation.replace(`/room/${rmid}`);
    }

    return (
        <Button
            id="room-hide-button"
            title="Hide Room"
            onClick={handleHide}
            className="p-2 flex flex-1 flex-col gap-2 border border-gray40 rounded-md"
        >
            <EyeSlashIcon />
            <span>Hide</span>
        </Button>
    )
}

const ActionSection = ({ display_name, mute, type, _id, uid }: Pick<FullRoomType, "mute" | "display_name" | "type" | "_id"> & { uid: string }) => {

    if (type === "private") return (
        <div className="flex gap-3 w-full sm:w-fit sm:mx-auto">
            <MuteButton rmid={_id} uid={uid} mute={mute} />
            <Navigate
                goto={`/u/${display_name}`}
                comp="link"
                className="p-2 flex flex-col gap-2 flex-1 sm:w-fit border border-gray40 rounded-md"
            >
                <UserIcon />
                <span className="text-sm">Profile</span>
            </Navigate>
            <HideRoomButton rmid={_id} uid={uid} />
        </div>
    )

    return (
        <div className="flex gap-3 w-full sm:w-fit sm:mx-auto">
            <MuteButton rmid={_id} uid={uid} mute={mute} />
            <LeaveRoomButton uid={uid} rmid={_id} />
            <HideRoomButton rmid={_id} uid={uid} />
        </div>
    )

}

const ChatInfoSection = ({ room, uid, children }: PropsWithChildren<{ room: FullRoomType, uid: string }>) => {

    return (
        <BottomSheet
            button={children}
            buttonTitle="View Details"
        >
            <div className="w-full px-2 pb-4 space-y-4 mb-4">
                <section className="flex flex-cntr-all w-full gap-4">
                    <ParloImage
                        frameType="userProfile"
                        className="min-w-12 size-12 object-cover"
                        containerClassName="max-h-12 overflow-hidden rounded-full"
                        classNameForFallback="min-w-8 size-8 p-1"
                        frame={room.poster}
                        size={48}
                        alt={`Poster of room ${room.display_name}`}
                    />
                    <div>
                        <h1 className="text-lg">{room.display_name}</h1>
                        <OptionalChildren condition={room.createdAt}>
                            <p className="ghostColor text-xs sm:text-sm">
                                Created At: {new Date(room.createdAt).toDateString()}
                            </p>
                        </OptionalChildren>
                    </div>
                </section>
                <section>
                    <ActionSection uid={uid} _id={room._id} display_name={room.display_name} mute={room.mute} type={room.type} />
                </section>
                <OptionalChildren condition={room.type !== "private"}>
                    <Navigate
                        comp="link"
                        goto={`${room._id}/participants`}
                        className="p-2 border border-gray30 rounded-md flex flex-cntr-between">
                        <span>Participants</span>
                        <RightChevron />
                    </Navigate>
                </OptionalChildren>
            </div>
        </BottomSheet>
    )

}

export default ChatInfoSection;