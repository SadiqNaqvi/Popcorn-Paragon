import { AblyEventParams, AblyEventType } from "@type/other";
import { Realtime, Rest } from "ably";

let ably_realtime: Realtime | null = null;
let ably_rest: Rest | null = null;

export const getAblyRest = () => {
  if (!ably_rest) ably_rest = new Rest(process.env.ABLY_API_KEY!);
  return ably_rest;
};

export const publishAblyEvent = async <T extends AblyEventType = AblyEventType>(event: T, data: AblyEventParams[T], users: string[]) => {

  const ably = getAblyRest();

  await Promise.all(users.map(uid => {
    const channel = ably.channels.get(uid);
    return channel.publish(event, data);
  }));

}

export const getAblyRealtime = async (): Promise<Realtime> => {
  if (!ably_realtime) {
    ably_realtime = new Realtime(process.env.ABLY_API_KEY!);
  }

  if (ably_realtime.connection.state === "connected") {
    return ably_realtime;
  }

  await new Promise<void>((resolve, reject) => {

    ably_realtime?.connection.once('connected', () => {
      console.log("Ably Realtime Connected");
      resolve();
    });

    ably_realtime?.connection.once('failed', (err) => {
      console.warn("Error Occured while getting Ably RealTime");
      reject(err);
    });

    ably_realtime?.connect();

  });

  return ably_realtime;
};