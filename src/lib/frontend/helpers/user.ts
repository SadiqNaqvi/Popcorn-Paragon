"use client";

import { PushNotificationWarningToast } from "@app/UserHydrator";
import { getAblyOnClient } from "@lib/frontend/providers/ably";
import { getPushState, unsubscribeToPushAndSync } from "@lib/frontend/helpers/push";
import { getQueryKeys } from "@lib/shared/utils";
import useNotification from "@store/notification";
import useRoomStore from "@store/roomStore";
import useCurrentUser from "@store/user";
import { CurrentUser, MereRoomType } from "@type/internal";
import { AblyEventParams } from "@type/other";
import { ConnectionStateChange } from "ably";
import { toast } from "sonner";
import { refetchQueries, showMessageOptimistically, updateDoc, updateDocInInfiniteQueryResult } from "./mutations";

const checkNotificationAndAlert = async () => {
    if (Notification.permission !== "granted") {
        PushNotificationWarningToast();
        return;
    }
    else if (await getPushState() === "granted") return;
}

const setUser = (user: CurrentUser, contentFiltering: boolean) => {

    if (!user) return;
    const { setUser, setUserMeta, setContentFiltering } = useCurrentUser.getState();
    setContentFiltering(contentFiltering);
    setUserMeta({ user_id: user._id, username: user.username, profile: user.profile });
    setUser(user);
}

export const setUserOnRefreshOrLogin = (user: CurrentUser, contentFiltering: boolean) => {

    setUser(user, contentFiltering);

    const ably = getAblyOnClient(user._id);
    const channel = ably.channels.get(user._id);
    channel.presence.enter({ status: "online" });

    checkNotificationAndAlert();

    const handleConnectionStateChange = (stateChange: ConnectionStateChange) => {
        if (stateChange.current === 'connected') {
            channel.presence.enter({ status: 'online' });
        }
    };

    ably.connection.on(handleConnectionStateChange);

    const handleNewNotification = ({ data }: { data?: AblyEventParams["notification"] }) => {
        if (!data) return;
        refetchQueries(getQueryKeys("notifications_uid", { uid: user._id }));
        toast.success(data.title, { icon: "🔔" });

        useNotification.setState({ newNotification: true });
    }

    const handleMessageArrival = ({ data }: { data?: AblyEventParams["message"] }) => {
        if (!data || data.user_id === user._id) return;

        const { room_id, room, ...rest } = data;

        const roomDetails = room ?? useRoomStore.getState().room[room_id];

        showMessageOptimistically({ message: { ...rest, room_id }, uid: user._id });

        if (typeof "window" === undefined) return;

        else if (window.location.pathname.startsWith(`/room/${room_id}`)) {
            useRoomStore.getState().updateRoom({
                seenAt: Date.now(),
            }, room_id);
            ably.channels.get(data.user_id).publish("entered_chat", {
                room_id,
                time: Date.now(),
                user_id: user._id,
            } as AblyEventParams["entered_chat"]);
        } else if (roomDetails) {
            toast.success(`New message arrived from ${roomDetails.display_name}`);
        } else {
            toast.success("New message arrived");
        }
    }

    const handleEnterChat = ({ data }: { data?: AblyEventParams["entered_chat"] }) => {
        if (!data || data.user_id === user._id) return;

        updateDoc(
            getQueryKeys("room_rmid_uid", { rmid: data.room_id, uid: user._id }),
            { otherParticipant_seenAt: data.time }
        )

        updateDocInInfiniteQueryResult<MereRoomType>(
            getQueryKeys("rooms_uid", { uid: user._id }),
            (room) => room.room_id === data.room_id,
            { otherParticipant_seenAt: data.time }
        )

    }

    const handleVisibility = () => {
        if (document.visibilityState === "hidden") {
            channel.presence.leave({ status: "offline" });
        } else {
            channel.presence.enter({ status: "online" });
        }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    channel.subscribe("notification", handleNewNotification);

    channel.subscribe("message", handleMessageArrival);

    channel.subscribe("entered_chat", handleEnterChat);

    return () => {
        document?.removeEventListener("visibilitychange", handleVisibility)
        channel.unsubscribe("notification", handleNewNotification);
        channel.unsubscribe("message", handleMessageArrival);
        channel.unsubscribe("entered_chat", handleEnterChat);
        channel.presence.leave();
        ably.connection.off(handleConnectionStateChange);
    }
}

export const logOutOnClient = (uid: string) => {
    const ably = getAblyOnClient(uid);
    const channel = ably.channels.get(uid);
    channel.presence.leave();
    ably.connection.off();
    channel.unsubscribe("notification");
    channel.unsubscribe("message");
    channel.unsubscribe("entered_chat");
    useCurrentUser.setState({ user: null, meta: null, filterContent: true, dataSaver: false });
    unsubscribeToPushAndSync(uid);
}
