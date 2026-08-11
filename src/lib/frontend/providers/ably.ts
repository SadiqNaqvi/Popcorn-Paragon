import { Realtime } from "ably";

let ably_realtime: Realtime | null = null;

export const getAblyOnClient = (client_id: string) => {
  if (!client_id) throw new Error("Client id is required to get ably.");

  if (!ably_realtime) {
    ably_realtime = new Realtime({
      authUrl: `/api/v1/ably`,
      clientId: client_id,
      autoConnect: true,
    });
  }

  return ably_realtime;
};