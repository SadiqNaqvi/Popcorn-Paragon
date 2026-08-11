"use client";

import { SendIcon, XmarkIcon } from "@assets/Icons";
import { Button, OptionalChildren } from "@components/ui";
import { acceptRoomInvitation, rejectRoomInvitation, sendMessage } from "@lib/frontend/helpers/mutations";
import { getAblyOnClient } from "@lib/frontend/providers/ably";
import { parloId } from "@lib/shared/utils";
import useGlobalStore from "@store/globalStore";
import useCurrentUser from "@store/user";
import { FullRoomType, MessageReplyType } from "@type/internal";
import { MessageSchemaType } from "@type/schemas";
import { RealtimeChannel } from "ably";
import { PropsWithChildren, useEffect, useRef } from "react";

type Props = {
    rmid: string,
    uid: string,
    room: FullRoomType;
}

const FooterWrapper = ({ children }: PropsWithChildren) => (
    <footer className="z-1 w-stretch absolute bottom-0 px-2 py-4 border-t border-gray40 bg-primary">
        {children}
    </footer>
);

const InputBar = ({ rmid, room }: Props) => {

    const [reply, setReply] = useGlobalStore<MessageReplyType | undefined>(`reply-${rmid}`, undefined);
    const { meta } = useCurrentUser();

    const formRef = useRef<HTMLFormElement>(null);
    const typingIndicatorInterval = useRef<NodeJS.Timeout>(null);
    const channel = useRef<RealtimeChannel>(null);

    const isRoomPending = Boolean(room.participant_count < 2 && room.participantType === "creator");

    useEffect(() => {
        if (!meta) return;
        channel.current = getAblyOnClient(meta.user_id).channels.get(meta.user_id)
    }, [meta]);

    if (!meta) return null;

    const acceptRoom = () => {
        acceptRoomInvitation(rmid, uid, room);
    }

    const rejectRoom = () => {
        rejectRoomInvitation(rmid, uid);
    }

    const uid = meta.user_id;

    if (room.participantType === "invitee") return (
        <FooterWrapper>
            <div className="flex flex-cntr-all gap-4">
                <Button
                    id="invitation-accept-button"
                    title="Accept"
                    className="flex-1 sm:max-w-fit primary"
                    onClick={acceptRoom}
                >
                    Accept
                </Button>
                <Button
                    id="invitation-reject-button"
                    title="Reject"
                    className="flex-1 sm:max-w-fit secondary"
                    onClick={rejectRoom}
                >
                    Reject
                </Button>
            </div>
        </FooterWrapper>
    )

    else if (isRoomPending) return (
        <FooterWrapper>
            <p className="text-sm text-center ghostColor">You need to wait till the user accepts your invitation.</p>
        </FooterWrapper>
    )

    const send = async (data: FormData) => {
        if (isRoomPending) return;

        const content = data.get("content")?.toString().trim();
        if (!content || !content.length) return;

        const message: MessageSchemaType = {
            _id: parloId(),
            content,
            createdAt: Date.now(),
            username: meta.username,
            replied_to: room ? reply?.replied_to : undefined,
            replied_content: room ? reply?.replied_content : undefined,
            room: {
                display_name: room.type === "private" ? meta.username : room.display_name,
                poster: room.type === "private" ? meta.profile : room.poster,
                mute: room.mute,
            }
        }

        reply && setReply(undefined);
        sendMessage(rmid, uid, message);

        formRef.current?.reset();
        window.scrollTo(0, window.outerHeight);
    }

    const indicateTyping = async () => {
        if (!typingIndicatorInterval.current) {
            channel.current?.presence.update({ status: "started_typing", room_id: rmid })
        }
        else
            clearTimeout(typingIndicatorInterval.current);

        typingIndicatorInterval.current = setTimeout(() => {
            channel.current?.presence.update({ status: "stopped_typing", room_id: rmid })
            typingIndicatorInterval.current = null;
        }, 5000);

    }

    return (
        <FooterWrapper>

            <OptionalChildren condition={reply}>
                <div className="pb-3 px-2 flex gap-2 flex-cntr-between">
                    <p className="line-clamp-2 text-sm">{reply?.replied_content}</p>
                    <Button
                        id="remove-reply-button"
                        title="Remove Reply"
                        className="p-2 bg-gray20 rounded-full"
                        onClick={() => setReply(undefined)}
                    >
                        <XmarkIcon className="size-2" />
                    </Button>
                </div>
            </OptionalChildren>

            <form
                ref={formRef}
                className="flex items-center gap-2"
                action={send}>
                <input
                    placeholder="Send Message"
                    enterKeyHint="send"
                    name="content"
                    onChangeCapture={indicateTyping}
                    maxLength={3000}
                    className="flex-1 p-3 border border-gray10 bg-gray10 rounded-full"
                />
                <Button
                    id="message-send-button"
                    title="Send"
                    type="submit"
                    className="size-fit p-2"
                >
                    <SendIcon />
                </Button>
            </form>
        </FooterWrapper>
    )

}

export default InputBar;