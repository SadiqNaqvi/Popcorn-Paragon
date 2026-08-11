"use server";
import { getAblyRest, publishAblyEvent } from "@lib/backend/providers/ably";
import { connectDatabase } from "@lib/backend/providers/database";
import { Notification, User } from "@model";
import { GeneralPostReturn } from "@type/internal";
import { NotificationModelType } from "@type/models";
import type { ClientSession } from "@type/mongoose";
import { AblyEventParams, PushNotificationType } from "@type/other";
import webpush, { PushSubscription } from 'web-push';
import { getParticipantMuteState } from "../redis/messaging";

webpush.setVapidDetails(
  `mailto:${process.env.QCORE_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const sendTestNotification = async (username: string, message: string): Promise<GeneralPostReturn> => {
  try {
    const connection = await connectDatabase();
    if (!connection)
      return { success: false, errCode: "database_connection_fail" }

    const user = await User.findOne({ username }, { push_auth: 1, push_endpoint: 1, push_p256dh: 1, profile: 1, });

    if (!user)
      return { success: false, errCode: "resource_not_found" };

    else if (!user.push_auth || !user.push_endpoint || !user.push_p256dh)
      return { success: false, errCode: "custom_error", customError: "User is not subscribed" };


    await webpush.sendNotification(
      {
        endpoint: user.push_endpoint,
        keys: {
          auth: user.push_auth,
          p256dh: user.push_p256dh,
        }
      },
      JSON.stringify({
        title: `Hey ${username}! Just Testing Notification`,
        body: message,
        icon: user.profile?.path,
      })
    );

    return { success: true, result: null }
  } catch (e: any) {
    console.error('Error sending push notification:', e);
    return { success: false, errCode: "custom_error", customError: e.message }
  }
}

export const sendAppNotification = async (uid: string, title: string) => {
  return await getAblyRest().channels.get(uid)
    .publish("notification", { title }, { client_id: uid })
}

export const sendPushNotification = async (subs: PushSubscription, n: PushNotificationType, urgent?: boolean) => {
  try {
    return await webpush.sendNotification(subs, JSON.stringify(n), {
      urgency: !urgent ? "high" : "normal",
      TTL: !urgent ? 0 : 3600,
    });
  } catch (e: any) {
    if (e.statusCode === 410) return;
    console.warn("Error while sending push notification", e);
    throw new Error(e);
  }
}

export const sendNotification = async (
  user_ids: string[],
  notification: Omit<NotificationModelType, "user_id">,
  session?: ClientSession,
  urgent = true,
) => {
  await Notification.create(
    user_ids.map(user_id => ({ ...notification, user_id })),
    { session, ordered: true }
  );

  const ably = getAblyRest();

  let onlineUsersIds: string[] = [];
  let offlineUsersIds: string[] = [];

  await Promise.all(
    user_ids.map(uid => ably.channels.get(uid)
      .presence.get()
      .then(r => {
        if (r.items.length) onlineUsersIds.push(uid);
        else offlineUsersIds.push(uid)
      })
    )
  );

  const offlineUsers = await User.find(
    { _id: { $in: offlineUsersIds } },
    { push_auth: 1, push_endpoint: 1, push_p256dh: 1 }
  )

  const simpleNotificationMessage = notification.message.map(n => n.type === "link" ? n.label : n.text).join(' ');

  await Promise.all<any>([

    ...onlineUsersIds.map(uid => sendAppNotification(uid, notification.title)),

    ...offlineUsers.map(user => {
      if (!user.push_auth || !user.push_endpoint || !user.push_p256dh) return;
      return sendPushNotification(
        {
          endpoint: user.push_endpoint,
          keys: {
            auth: user.push_auth,
            p256dh: user.push_p256dh,
          }
        },
        {
          title: notification.title,
          body: simpleNotificationMessage,
          icon: notification.poster,
        },
        urgent
      )
    })
  ])
};

export const sendNotificationForMessage = async (user_ids: string[], notification: PushNotificationType, data: AblyEventParams["message"]) => {
  const ably = getAblyRest();

  let onlineUsersIds: string[] = [];
  let offlineUsersIds: string[] = [];

  console.log("getting presence for", user_ids);
  await Promise.all(
    user_ids.map(uid => ably.channels.get(uid)
      .presence.get()
      .then(r => {
        if (r.items.length) onlineUsersIds.push(uid);
        else offlineUsersIds.push(uid)
      })
    )
  );

  const muteState = offlineUsersIds.length ? await getParticipantMuteState(offlineUsersIds, data.room_id) : [];
  const unMuteUsers = muteState.filter(state => !state.mute).map(state => state.uid);

  const offlineUsers = unMuteUsers.length ?
    await User.find(
      { _id: { $in: unMuteUsers } },
      { push_auth: 1, push_endpoint: 1, push_p256dh: 1, _id: 1 }
    )
    : [];

  await Promise.all<any>([

    publishAblyEvent(
      "message",
      data,
      onlineUsersIds,
    ),
    ...offlineUsers.map(user => {
      if (!user.push_auth || !user.push_endpoint || !user.push_p256dh) return;

      return sendPushNotification(
        {
          endpoint: user.push_endpoint,
          keys: {
            auth: user.push_auth,
            p256dh: user.push_p256dh,
          }
        },
        notification,
        true
      )
    })
  ]);
}
