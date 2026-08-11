"use client";

import { BellIcon } from "@assets/Icons";
import { getQueryClient } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import useNotification from "@store/notification";
import useCurrentUser from "@store/user";
import { InfiniteScrollerDataType } from "@type/other";
import { useEffect } from "react";

const NotificationButton = () => {
    const { user, isHydrated } = useCurrentUser();
    const { checkNewNotification, newNotification, isHydrated: hydrated } = useNotification();

    useEffect(() => {
        if (!user || !isHydrated || !hydrated) return;

        const result = getQueryClient().getQueryData<InfiniteScrollerDataType>(getQueryKeys("notifications_uid", { uid: user._id }));
        if (!result) return;
        checkNewNotification(result.pages[0]?.results[0]);

    }, [user, isHydrated, checkNewNotification, hydrated]);

    return (
        <div className={newNotification ? "notificationBadge" : "contents"}>
            <BellIcon />
        </div>
    )
}

export default NotificationButton;