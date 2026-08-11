'use client';

import { AppIcon } from '@assets/Icons';
import { Navigate } from '@components';
import { authenticateUser } from '@lib/backend/actions/auth';
import { logOutOnClient, setUserOnRefreshOrLogin } from '@lib/frontend/helpers/user';
import { getQueryClient } from '@lib/backend/providers/queryClient';
import { getQueryKeys, getTimeInFuture } from '@lib/shared/utils';
import useCurrentUser from '@store/user';
import { CurrentUser, TokenPayload } from '@type/internal';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const PushNotificationWarningToast = () => {

    const lastDate = localStorage.getItem("pushWarning");

    // Send once in 6 hours only
    if (lastDate && getTimeInFuture({ unit: "h", timeVal: 6, from: lastDate }) > Date.now()) return;

    toast("Push Notification is not enabled!", {
        icon: null,
        className: "bg-primarylight border border-gray30 rounded-md grid grid-cols-2 p-2 gap-2",
        description: "We cannot notify you anything related to your account.",
        descriptionClassName: "text-sm my-2",
        classNames: {
            cancelButton: "secondary col-start-2 -col-end-1 row-start-2",
            content: "col-span-2",
            title: "text-lg"
        },
        action: (
            <Navigate comp="button" goto="/settings/notification" className="inline primary btn col-start-1 col-end-2">
                View
            </Navigate>
        ),
        cancel: { label: "Dismiss", onClick: () => { } },
        duration: 3600 * 1000,
        unstyled: true,

    });

    localStorage.setItem("pushWarning", new Date().toString());
}

const checkIfInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor;

    const appBrowsers =
        /(Instagram|FBAN|FBAV|FB_IAB|TikTok|Snapchat|Twitter|Line|LinkedIn|Pinterest)/i.test(ua);

    const iOSWebView =
        /iPhone|iPad|iPod/.test(ua) && !/Safari/i.test(ua);

    return appBrowsers || iOSWebView;
}

const UserHydrator = ({ payload, currentUser }: { payload: TokenPayload | null, currentUser: CurrentUser | null }) => {

    const { user } = useCurrentUser();
    const pathname = usePathname();
    const router = useRouter();
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);

    useEffect(() => {
        if (payload || !user) return;

        // If payload is not available (sometimes on first load from notification click, cookies are not set properly);
        // Rely on cached user data until user is authenticated;
        authenticateUser()
            .then(resp => {

                if (!resp) logOutOnClient(user._id);
                else router.refresh();
            })
            .catch(e => console.error(e));

        return setUserOnRefreshOrLogin(user, !!user.filterContent);
    }, [user]);

    useEffect(() => {

        setIsInAppBrowser(checkIfInAppBrowser());

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .catch(err => console.error('SW failed', err))
            })
        }

        if (!payload) return;

        const { username } = payload;

        const queryClient = getQueryClient();
        const qkeys = getQueryKeys("user_username", { username });
        let userToStore: CurrentUser | null = null;

        // Update user hash with the freshly fetched user data.
        if (currentUser) {
            userToStore = currentUser;
        }

        // For offline
        else {

            // The Local Storage (indexed db here) may got cleared but we know that the user exists.
            if (!user) return;

            userToStore = user;
            queryClient.setQueryData(qkeys, user);
        }

        return setUserOnRefreshOrLogin(userToStore, payload.filterContent);

    }, []);

    // Handle prev navigation, redirect user to home page when navigating backward if no history state exists.
    useEffect(() => {
        const handlePrevNavigation = (event: any) => {
            const state = event.state;

            if (!state || state.app !== "Parlocula" || state.type !== "root" || pathname.includes("/home")) return;

            // If user is at root, redirect them to home page;
            router.replace('/home');
        }

        window.history.replaceState({ app: "Parlocula", type: "root" }, "");

        window.history.pushState({ app: "Parlocula", type: "guard" }, "");

        window.addEventListener("popstate", handlePrevNavigation);
        return () => {
            window.removeEventListener("popstate", handlePrevNavigation);
        }

    }, []);

    if (isInAppBrowser) return (
        <section className="fixed bg-primary z-50 inset-0 flex flex-col">
            <AppIcon className="size-12 md:size-24 customSize m-auto" />
            <div className="w-full space-y-4 sticky bottom-10 px-2">
                <p className="font-semibold text-center text-lg">Recommended: Open this in browser.</p>
                <p className='text-center'>Click on the options ( ⋮ ) or share icon and open it in browser</p>
            </div>
        </section>
    )

    return null;
}

export default UserHydrator;
