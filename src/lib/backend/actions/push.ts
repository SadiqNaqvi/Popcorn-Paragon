"use server";

import { connectDatabase } from "@lib/backend/providers/database";
import { User } from "@model";
import { GeneralPostReturn } from "@type/internal";
import webpush, { PushSubscription } from 'web-push';

webpush.setVapidDetails(
  `mailto:${process.env.QCORE_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const subscribeToPush = async (user_id: string, subscription: PushSubscription): Promise<GeneralPostReturn> => {
  try {
    const connection = await connectDatabase();
    if (!connection)
      return { success: false, errCode: "database_connection_fail" }

    const user = await User.findByIdAndUpdate(user_id, {
      push_endpoint: subscription.endpoint,
      push_p256dh: subscription.keys.p256dh,
      push_auth: subscription.keys.auth,
    });

    if (!user) return { success: false, errCode: "resource_not_found" }

    return { success: true, result: null };
  } catch (e: any) {
    console.warn("Error occured while subscribing to push notification", e);
    return { success: false, errCode: "unknown_error" }
  }
}

export const unsubscribeToPush = async (user_id: string): Promise<GeneralPostReturn> => {
  try {
    const connection = await connectDatabase();
    if (!connection)
      return { success: false, errCode: "database_connection_fail" }

    const user = await User.findByIdAndUpdate(user_id, {
      $unset: {
        push_endpoint: 1,
        push_p256dh: 1,
        push_auth: 1,
      }
    });

    if (!user) return { success: false, errCode: "resource_not_found" }

    return { success: true, result: null };
  } catch (e: any) {
    console.warn("Error occured while subscribing to push notification", e);
    return { success: false, errCode: "unknown_error" }
  }
}