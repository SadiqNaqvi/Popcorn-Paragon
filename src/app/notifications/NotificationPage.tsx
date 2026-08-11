"use client";

import { InfiniteScroller, Navbar } from "@components";
import LoginModal from "@components/fallbacks/LoginModal";
import StatusBanner from "@components/notifications/StatusBanner";
import { NotificationPageSkeleton } from "@components/ui/loading";
import NotificationTile from "@components/ui/NotificationTile";
import { getNotificationsOfUser } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import useNotification from "@store/notification";
import useCurrentUser from "@store/user";
import { useEffect } from "react";

const NotificationPage = () => {

    const { meta } = useCurrentUser();

    useEffect(() => {
        if (meta)
            useNotification.setState({ newNotification: false });
    }, []);

    if (!meta) return (
        <LoginModal redirectTo="/notifications" />
    )

    return (
        <main>
            <Navbar navTitle="Notifications" />
            <StatusBanner />
            <section className="bg-primary">
                <InfiniteScroller
                    Component={NotificationTile}
                    Loading={<NotificationPageSkeleton count={12} />}
                    fetchData={(p) => getNotificationsOfUser(meta.user_id, p)}
                    queryKeys={getQueryKeys("notifications_uid", { uid: meta.user_id })}
                    className="px-2"
                />
            </section>
        </main>
    )

}

export default NotificationPage;