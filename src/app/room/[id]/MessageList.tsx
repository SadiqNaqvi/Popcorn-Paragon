"use client";

import { ShowError } from "@components/fallbacks";
import MessageBottomSheet from "@components/sheets/MessageBottomSheet";
import { MessageBar, OptionalChildren } from "@components/ui";
import MessageSkeleton from "@components/ui/loading/MessageSkeleton";
import { getMessages } from "@lib/shared/helpers/internal_fetchers";
import { updateParticipantSeenAt } from "@lib/frontend/helpers/mutations";
import { useInfiniteQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import useOfflineStore from "@store/offlineStore";
import useRoomStore from "@store/roomStore";
import { FullRoomType, InfiniteQueryResponse, MereMessage } from "@type/internal";
import { ErrorCodes } from "@type/other";
import React, { useEffect, useRef } from "react";

const MessageList = ({ uid, room }: { uid: string, room: FullRoomType }) => {

    const { participantType, type, invitationMessage, seenAt, otherParticipant_seenAt, participant_count } = room;
    const rmid = room._id;

    const qKeys = getQueryKeys("messages_rmid", { rmid });
    const [messageList, setMessageList] = useOfflineStore<InfiniteQueryResponse<MereMessage> | undefined>(qKeys, undefined);
    const { updateRoom } = useRoomStore();
    const container = useRef<HTMLDivElement>(null);

    const { data, refetch, isLoading, error, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQueryHook<MereMessage>({
        queryKeys: qKeys,
        queryFn: (p) => getMessages(uid, rmid, p),
        placeholderData: messageList,
        onSuccess: (data) => {
            const [first] = data.pages;
            if (first.page === 1) setMessageList(first);
        }
    });

    useEffect(() => {
        if (participantType === "invitee" || !data || !data.pages.length || !data.pages[0]?.results?.length || new Date(room.lastMessageAt) <= new Date(room.seenAt)) return;

        else if (type === "group") {
            updateRoom({ seenAt: Date.now() }, rmid);
        }

        else updateParticipantSeenAt(rmid, uid);

        const current = container.current
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isFetchingNextPage && hasNextPage)
                fetchNextPage();
        }, { threshold: 0.1 })

        if (current) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        }

    }, []);

    const messages = React.useMemo(() => {
        return data?.pages?.flatMap(page => page?.results)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [data]);

    if (isLoading) return <MessageSkeleton />

    else if (error) return (
        <ShowError
            heading="Something went wrong"
            errCode={error.message as ErrorCodes}
            retry={refetch}
        />
    )

    else if (participantType === "invitee" || participant_count < 2) return (
        <section className="mt-4 px-2">
            <MessageBar
                _id=""
                room_type={type}
                content={invitationMessage.content}
                createdAt={invitationMessage.createdAt}
                cuid={uid}
                room_id={rmid}
                user_id={invitationMessage.user_id}
                username={invitationMessage.username}
                seenAt={seenAt}
                status="sent"
            />
        </section>
    )

    else if (!data || !data.pages[0]?.results?.length) return (
        <section className="px-2 h-size-screen pt-4 relative">
            <p className="p-2 rounded-md text-center bg-gray10 border border-gray10 backdrop-blur-xs">
                Messages dissapear every 24 hours. Send a message to start conversation.
            </p>
            <div className="patternBackground"></div>
        </section>
    );

    return (
        <section className="h-size-screen relative overflow-y-auto pt-4 pb-22">

            <ul className="w-full px-2 relative z-1">
                {messages.map((msg, ind) => (
                    <MessageBar
                        {...msg}
                        otherParticipantSeenAt={otherParticipant_seenAt}
                        room_type={type}
                        key={msg._id}
                        nextMsgAuthor={messages[ind + 1]?.user_id}
                        prevMsgAuthor={messages[ind - 1]?.user_id}
                        cuid={uid}
                        seenAt={seenAt}
                    />
                ))}
            </ul>

            <div className="patternBackground"></div>

            <OptionalChildren condition={isFetchingNextPage}>
                <div className="my-4 mx-auto" ref={container}>
                    <MessageSkeleton />
                </div>
            </OptionalChildren>

            <MessageBottomSheet />
        </section>
    )

}

export default MessageList;