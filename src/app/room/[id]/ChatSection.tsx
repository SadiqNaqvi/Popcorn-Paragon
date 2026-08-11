"use client";

import { LeftChevron } from "@assets/Icons";
import { GenericWrapper, Navigate } from "@components";
import { ParloImage } from "@components/ui";
import { getRoomById } from "@lib/shared/helpers/internal_fetchers";
import { useAblyPresence } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import useOfflineStore from "@store/offlineStore";
import { FullRoomType, RoomEnumType } from "@type/internal";
import ChatInfoSection from "./ChatInfoSection";
import InputBar from "./InputBar";
import MessageList from "./MessageList";
import { ChatSectionSkeleton } from "@components/ui/loading";

type PresenceProps = {
    uid: string,
    otherParticipant?: string,
    rmid: string
    room_type: RoomEnumType,
}

const PresenceStatus = ({ otherParticipant, uid, rmid, room_type }: PresenceProps) => {

    const presence = useAblyPresence(uid, otherParticipant, rmid);

    
    if (presence === "typing") return (
        <div className="flex gap-1 items-center text-left text-orange-500">
            <span className="text-lg leading-3">•</span>
            <span className="text-xs">Typing...</span>
        </div>
    )

    else if (room_type !== "private" || !otherParticipant) return;

    if (presence === "online") return (
        <div className="flex gap-1 items-center text-left text-lime-500">
            <span className="text-lg leading-3">•</span>
            <span className="text-xs">Online</span>
        </div>
    )

    return (
        <div className="flex gap-1 items-center text-left text-gray-500">
            <span className="text-lg leading-3">•</span>
            <span className="text-xs">Offline</span>
        </div>
    )

}

type Props = { rmid: string, uid: string }

const Component = (data: FullRoomType, { rmid, uid }: Props) => {
    return (
        <>
            <header className="z-1 sticky top-0 bg-primary border-b border-gray40 flex h-16 px-2 items-center gap-2">
                <Navigate comp="button" goto="back">
                    <LeftChevron />
                </Navigate>
                <ChatInfoSection room={data} uid={uid}>
                    <div className="flex gap-3 items-center">
                        <ParloImage
                            frameType="userProfile"
                            className="min-w-12 size-12 object-cover"
                            containerClassName="max-h-12 overflow-hidden rounded-full"
                            classNameForFallback="min-w-8 size-8 p-1"
                            frame={data.poster}
                            size={48}
                            alt={`Poster of room - ${data.display_name}`}
                        />
                        <div>
                            <h1>{data.display_name || "Unavailable"}</h1>
                            <PresenceStatus
                                otherParticipant={data.otherParticipant_id}
                                uid={uid}
                                rmid={rmid}
                                room_type={data.type}
                            />
                        </div>
                    </div>
                </ChatInfoSection>
            </header>

            <MessageList room={data} uid={uid} />

            <InputBar rmid={rmid} room={data} uid={uid} />
        </>
    )
}

const ChatSection = ({ rmid, uid }: Props) => {

    const qkey = getQueryKeys("room_rmid_uid", { rmid, uid })
    const [room, setRoom] = useOfflineStore<FullRoomType | undefined>(qkey, undefined);

    return (
        <GenericWrapper
            component={Component}
            loadingComponent={<ChatSectionSkeleton />}
            getQueryProps={() => ({
                args: [uid, rmid],
                queryFn: getRoomById,
                queryKeys: qkey,
                onSuccess: setRoom,
            })}
            props={{ rmid, uid }}
            placeholderData={room}
            needUser
        />
    )

}

export default ChatSection;