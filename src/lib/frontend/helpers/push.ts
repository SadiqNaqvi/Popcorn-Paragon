import { subscribeToPush, unsubscribeToPush } from "@lib/backend/actions/push";

export const getPushSubscription = async () => {
    const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
    });

    return await registration.pushManager.getSubscription();
}

export const getPushState = async () => {
    const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
    });

    return await registration.pushManager.permissionState({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
    });
}

export const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export const subscribeToPushOnClient = async () => {

    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
    });
}

export const unsubscribeToPushOnClient = async (sub?: PushSubscription) => {
    const subscription = sub ?? await getPushSubscription();
    if (!subscription) return false;
    return await subscription.unsubscribe();
}

export const subscribeToPushAndSync = async (uid: string) => {
    const sub = await subscribeToPushOnClient();

    return await subscribeToPush(uid, JSON.parse(JSON.stringify(sub)));
}

export const unsubscribeToPushAndSync = async (uid: string, sub?: PushSubscription) => {
    await unsubscribeToPushOnClient(sub);
    await unsubscribeToPush(uid);
}