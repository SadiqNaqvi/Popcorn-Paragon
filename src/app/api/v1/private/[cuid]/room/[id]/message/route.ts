import { getHandler, postHandler } from "@lib/backend/helpers/handlers";
import { checkIfParticipantExists, getMessagesFromCache, getParticipant, getParticipantsOfRoom, handleNewMessage, storeMessagesInCache } from "@lib/backend/redis/messaging";
import { sendNotificationForMessage } from "@lib/backend/actions/notification";
import { createPipeline } from "@lib/backend/helpers/pipelines";
import { messageSchema } from "@lib/shared/validation/schemas";
import { getPoster } from "@lib/shared/utils";
import { getPageParams } from "@lib/backend/utils";
import { Message } from "@model";
import { MessageModelType } from "@type/models";
import { MessageSchemaType } from "@type/schemas";

// Get Messages of a room
export const GET = getHandler(async (r, params) => {
  const { cuid, id } = params;
  const page = getPageParams(r) - 1;

  const participant = await getParticipant(id, cuid);

  if (!participant) return { success: false, errCode: "unauthorized_access" }

  const response = await getMessagesFromCache(id, cuid, page);

  console.log("Messages from cache", response);

  if (response && response.data.length) return { success: true, result: response };

  const resp = await Message.aggregate(createPipeline({
    filters: [
      { $match: { room_id: id, createdAt: { $gt: new Date(participant.hideAt) } } },
    ],
    sort: { createdAt: -1 },
    page,
    projection: {
      content: 1,
      createdAt: 1,
      room_id: 1,
      user_id: 1,
      username: 1,
      replied_to: 1,
      replied_conten: 1,
    }
  }));

  const result = resp[0] ?? { data: [], total: 0 };

  console.log("Messages from db", result);

  if (result.data.length) {
    await storeMessagesInCache(id, result.data, result.total);
  }

  return { success: true, result };
});

// Post message in a room
export const POST = postHandler<MessageSchemaType>({
  handler: async ({ params, user_id, data, username, session }) => {

    const room_id = params.id;

    const { room, ...rest } = data;

    const participants = await getParticipantsOfRoom(room_id);

    await sendNotificationForMessage(
      participants.filter(p => !(p.type === "invitee" || p.uid === user_id)).map(p => p.uid),
      {
        title: "New message",
        body: `${room.display_name}: ${rest.content.slice(0, 50)}`,
        icon: room.poster ? getPoster({ external: false, path: room.poster.path, extSource: room.poster.extSource }) : undefined,
        path: `/room/${room_id}-${room.display_name}`,
        tag: `message-${room_id}`,
      },
      { ...rest, room, room_id, user_id }
    );

    const message: MessageModelType = { ...rest, room_id, user_id, username };

    await handleNewMessage(room_id, message, session);

    return { success: true, result: null, revalidateQueue: [] };
  },
  schema: messageSchema,
  preCheck: async ({ params, user_id }) => {
    const participantExists = await checkIfParticipantExists(params.id, user_id);
    if (participantExists) return { success: true };
    else return { success: false, errCode: "unauthorized_access" };
  },
});