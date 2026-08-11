import { deleteRooms } from "@lib/backend/helpers/deletion";
import { deleteHandler, getHandler, postHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { checkIfUserMetaExists, getParticipant, getParticipantsOfRoom, getRoomDetails, setDataWhileCreatingRoom, setRoomDetail } from "@lib/backend/redis/messaging";
import { convertMatchToLookupExpr } from "@lib/backend/helpers/pipelines";
import { roomSchema, roomUpdateSchema } from "@lib/shared/validation/schemas";
import { Connection, Participant, Room, User } from "@model";
import { FullRoomType } from "@type/internal";
import { RoomSchemaType, RoomUpdateSchemaType } from "@type/schemas";

// Get the details of the room
export const GET = getHandler(async (_, params) => {
  const { cuid, id } = params;

  const room = await getRoomDetails(id, cuid);

  console.log("room details from cache", room)
  if (room) return { success: true, result: room };

  const resp = await Room.aggregate([
    { $match: { _id: id } },
    // Details of the current participant
    {
      $lookup: {
        from: "participants",
        let: { room_id: "$_id" },
        pipeline: [
          convertMatchToLookupExpr({ room_id: "$$room_id", user_id: cuid }),
          { $project: { type: 1, seenAt: 1, mute: 1 } },
          { $limit: 1 },
        ],
        as: "participant",
      },
    },
    // Details of the other participant
    {
      $lookup: {
        from: "participants",
        let: { room_id: "$_id" },
        pipeline: [
          convertMatchToLookupExpr({ room_id: "$$room_id", user_id: { $ne: cuid }, type: { $ne: "invitee" } }),
          { $project: { user_id: 1, seenAt: 1 } },
          { $limit: 1 }
        ],
        as: "otherParticipant",
      },
    },
    // Other Participants metadata
    {
      $lookup: {
        from: "users",
        localField: "otherParticipant.user_id",
        foreignField: "_id",
        pipeline: [{ $project: { username: 1, profile: 1 } }],
        as: "otherUser",
      },
    },
    {
      $addFields: {
        // "users.seenAt": { $arrayElemAt: ["$participants.seenAt", 0] },
        // "users.participantType": { $arrayElemAt: ["$participants.type", 0] },
        participantType: { $arrayElemAt: ["$participant.type", 0] },
        seenAt: { $arrayElemAt: ["$participant.seenAt", 0] },
        mute: { $arrayElemAt: ["$participant.mute", 0] },
        display_name: {
          $cond: {
            if: { $eq: ["$type", "group"] },
            then: "$name",
            else: { $arrayElemAt: ["$otherUser.username", 0] },
          },
        },
        poster: {
          $cond: {
            if: { $eq: ["$type", "group"] },
            then: "$poster",
            else: { $arrayElemAt: ["$otherUser.profile", 0] },
          },
        },
        otherParticipant_id: {
          $cond: {
            if: { $eq: ["$type", "group"] },
            then: undefined,
            else: { $arrayElemAt: ["$otherParticipant.user_id", 0] },
          },
        },
        otherParticipant_seenAt: {
          $cond: {
            if: { $eq: ["$type", "group"] },
            then: undefined,
            else: { $arrayElemAt: ["$otherParticipant.seenAt", 0] },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        display_name: 1,
        poster: 1,
        participant_count: 1,
        type: 1,
        seenAt: 1,
        mute: 1,
        participantType: 1,
        otherParticipant_seenAt: 1,
        otherParticipant_id: 1,
        invitationMessage: 1,
        lastMessage: 1,
        lastMessageBy: 1,
        lastMessageAt: 1,
        createdAt: 1,
      },
    },
  ]);

  const result: FullRoomType = resp[0];

  console.log("room details from db", result);

  // Rare case
  if (result?.participant_count === 0) return {
    success: false, errCode: "resource_not_found"
  };

  if (result) await setRoomDetail(id, result);

  return { success: true, result };
});

// Create a new room
export const POST = postHandler<RoomSchemaType>({
  handler: async ({ data, frames, params, user_id, username, session, isNsfw }) => {
    const { inviteMessage, type, name } = data;

    const { id } = params;

    const isPrivate = type === "private";
    const poster = frames[0];

    const participants = Array.from(new Set(data.participants.concat(user_id)));

    const resp = await Room.create(
      [
        {
          _id: id,
          participants: isPrivate ? [...participants, user_id].sort() : [],
          type,
          name: isPrivate ? undefined : name,
          poster: !isPrivate && poster ? poster : undefined,
          lastMessage: inviteMessage,
          lastMessageAt: Date.now(),
          lastMessageBy: user_id,
          invitationMessage: {
            content: inviteMessage,
            createdAt: Date.now(),
            username,
            user_id,
          },
        },
      ],
      { session, ordered: true }
    )

    const room = resp[0]?.toObject();

    if (!room)
      return { success: false, errCode: "data_storing_fail" };

    const now = new Date(Date.now() - 1000 * 3600 * 24);

    await Participant.create(
      participants.map((uid) => ({
        hideAt: now,
        mute: false,
        room_id: id,
        seenAt: now,
        type: uid === user_id ? "creator" : "invitee",
        user_id: uid,
      })),
      { session, ordered: true }
    );

    await setDataWhileCreatingRoom(room, user_id, participants);

    await checkIfUserMetaExists([...participants, user_id]);

    return {
      success: true,
      result: room,
      revalidateQueue: participants.map((u) => `roomInvitations-${u}`),
      warnTeamParlocula: isNsfw ? {
        title: "The poster of this room may be nsfw.",
        desc: `The poster of this room may be containing nsfw. The path of the poster is attached below. Room_id= ${room._id}, created by ${user_id} (@${username}).`,
        path: `${poster.path}`
      } : undefined
    };
  },
  preCheck: async ({ data, user_id }) => {
    const { participants } = data;
    const isBlocked = await Connection.findOne({
      follower: user_id,
      followee: { $in: participants },
      blocked: true,
    });

    if (isBlocked) return { success: false, errCode: "blocked_by_author" };
    return { success: true };
  },
  schema: roomSchema,
});

// Updating name or/and poster of the room (non-private)
export const PATCH = updateHandler<RoomUpdateSchemaType>({
  handler: async ({ data, frames, params, isNsfw, session, user_id, username, areFilesToDelete }) => {
    const { id } = params;
    const room = await Room.findById(id, { type: 1 });

    if (!room)
      return { success: false, errCode: "resource_not_found" }
    else if (room.type === "private")
      return { success: false, errCode: "unauthorized_access" }

    const poster = frames.length ? frames[0] : undefined;

    const { name } = data;

    const fieldsToUpdate = {
      ...(name && { name }),
      ...(frames.length && { poster: frames[0] }),
    }

    await Room.findByIdAndUpdate(id, {
      $set: fieldsToUpdate,
      ...(!frames.length && areFilesToDelete && { $unset: { poster: 1 } }),

    }, { session });

    await setRoomDetail(id, fieldsToUpdate);

    return {
      success: true,
      result: fieldsToUpdate,
      revalidateQueue: [],
      warnTeamParlocula: isNsfw && poster ? {
        title: "The poster of this room may be nsfw.",
        desc: `The poster of this room may be containing nsfw. The path of the poster is attached below. Room poster was getting updated. Room_id= ${room._id}, updated by ${user_id} (@${username}).`,
        path: `${poster.path}`
      } : undefined
    }
  },
  schema: roomUpdateSchema,
  preCheck: async ({ user_id, params }) => {
    const { id } = params;
    const participant = await getParticipant(id, user_id);
    if (!participant || participant.participantType !== "creator")
      return { success: false, errCode: "unauthorized_access" }

    return { success: false }

  }
});

// Deleting a non-private room
export const DELETE = deleteHandler(async ({ params, user_id, session }) => {
  const { id } = params;

  const participant = await getParticipant(params.id, user_id);

  if (participant.participantType !== "creator")
    return { success: false, errCode: "unauthorized_access" };

  const participants = await getParticipantsOfRoom(id);

  await Promise.all(participants.map(({ uid, type }) => {
    if (type !== "invitee") {
      return User.findByIdAndUpdate(uid,
        { $inc: { rooms: -1 } },
        { session }
      )
    }
  }));

  await deleteRooms({ _id: id, type: { $ne: "private" } }, session);

  return { success: true };
});
