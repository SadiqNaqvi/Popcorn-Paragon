"use client";

import Navigate from "@components/Navigate";
import { getPushSubscription } from "@lib/frontend/helpers/push";
import useCurrentUser from "@store/user";
import { useEffect, useState } from "react";

const StatusBanner = () => {

    const [isEnabled, setIsEnabled] = useState(false);
    const { meta } = useCurrentUser();

    useEffect(() => {
        if (!meta) return;
        getPushSubscription().then(r => {
            if (r) setIsEnabled(true);
        });

    }, [meta]);

    if (!meta) return null;

    if (!isEnabled) return (
        <section className="px-2 my-4">

            <div className="p-2 border border-gray10 bg-gray10 rounded-md">
                <h2 className="sm:text-lg mb-3">Push Notification is not enabled 😨</h2>
                <div className="sapce-y-1">
                    <p className="text-sm ghostColor">
                        This means we cannot notify you with any update related to you account when the app is closed.
                    </p>
                    <p className="text-sm ghostColor">
                        Please enable notification to keep yourself updated even when the app is closed.
                    </p>
                </div>

                <Navigate
                    className="primary rounded-full btn sm:w-fit"
                    type="button"
                    comp="link"
                    goto="/settings/notification">
                    View
                </Navigate>
            </div>

        </section>
    )
}

export default StatusBanner;