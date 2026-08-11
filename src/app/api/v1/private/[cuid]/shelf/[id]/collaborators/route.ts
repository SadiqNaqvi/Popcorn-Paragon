import { shelfCollaboratorsLimit } from "@lib/shared/constants";
import { getHandler, postHandler, PrecheckFunction, updateHandler } from "@lib/backend/helpers/handlers";
import { sendNotification } from "@lib/backend/actions/notification";
import { convertMatchToLookupExpr } from "@lib/backend/helpers/pipelines";
import { createArrayOfUidsSchema } from "@lib/shared/validation/schemas";
import { getPoster } from "@lib/shared/utils";
import { Connection, Notification, Shelf } from "@model";
import Collaborator from "@model/collaborators";

// Get all the collaborators and invitees of a shelf, only creator can see it.
export const GET = getHandler(async (r, params) => {
  const { id, cuid } = params;

  const isCreator = await Shelf.exists({ _id: id, user_id: cuid });
  if (!isCreator)
    return { success: false, errCode: "unauthorized_access" }

  const collaborators = await Collaborator.aggregate([
    { $match: { shelf_id: id } },
    { $limit: shelfCollaboratorsLimit + 1 },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        pipeline: [
          convertMatchToLookupExpr({ isActive: true }),
          { $project: { _id: 1, username: 1, profile: 1 } }
        ],
        as: "user",
      }
    },
    {
      $addFields: {
        username: { $arrayElemAt: ["$user.username", 0] },
        user_id: { $arrayElemAt: ["$user._id", 0] },
        profile: { $arrayElemAt: ["$user.profile", 0] },
      }
    },
    {
      $project: {
        type: 1,
        username: 1,
        user_id: 1,
        profile: 1,
      }
    }
  ]).exec();

  return { success: true, result: { collaborators, creator: cuid } };
});

const schema = createArrayOfUidsSchema(shelfCollaboratorsLimit);
type SchemaType = { users: string[] }

const preCheck: PrecheckFunction<SchemaType> = async ({ data, user_id, params }) => {
  const { id } = params;
  const { users } = data;

  // Check 1: Make sure all the added users are a follower of the current user.
  const followers = await Connection.countDocuments({
    follower: { $in: users },
    followee: user_id,
    blocked: false,
  });

  if (followers !== users.length)
    return { success: false, errCode: "blocked_by_author" };

  // Check 2: Make sure only the creator of the shelf can invite people
  // Check 3: Make sure invitees + collaborators <= collaboratos limit
  const shelf = await Shelf.exists({ _id: id, user_id });
  if (!shelf) return { success: false, errCode: "unauthorized_access" }

  const total = await Collaborator.countDocuments({ shelf_id: id });

  if ((total + data.users.length) > shelfCollaboratorsLimit)
    return {
      success: false,
      errCode: "invalid_input",
      customError: `Only ${shelfCollaboratorsLimit} collaborators are allowed for now and you have already added ${total}.`
    };

  return { success: true };
}

// Invite followers to collaborate in one of user's shelf
export const POST = postHandler<SchemaType>({
  handler: async ({ data, params, user_id, username, session, profile }) => {
    const { id } = params;
    const { users } = data;

    const shelf = await Shelf.findById(id, { name: 1, poster: 1 });

    if (!shelf)
      return { success: false, errCode: "resource_not_found" }

    await Collaborator.create(
      users.map(user_id => ({
        shelf_id: id,
        user_id,
        type: "invitee",
      })),
      { session }
    );

    await sendNotification(
      users.map((u) => u),
      {
        title: `${username} has invited you to collaborate in one of their shelfs`,
        poster: shelf.poster ? getPoster({ path: shelf.poster, type: "poster", size: "w92", external: true }) : profile,
        path: "/notifications",
        message: [
          { type: "link", label: username, path: `/u/${username}` },
          {
            type: "text",
            text: "has invited you to collaborate in one of their shelfs",
          },
          { type: "link", label: shelf.name, path: `/s/${id}` },
        ],
        content_id: id,
        type: "request",
        metadata: {
          shelf_id: id,
          sender_id: user_id,
        },
        request_type: "collaborator_invitation",
        status: "pending",
      },
      session
    );

    return {
      success: true,
      result: null,
      revalidateQueue: users.map((u) => `notifications-user-${u}`),
    };
  },
  schema,
  preCheck,
});

// Kick collaborators or invitees
export const PATCH = updateHandler<SchemaType>({
  handler: async ({ data, params, session }) => {
    const { id } = params;
    const { users } = data;

    await Collaborator.deleteMany({
      shelf_id: id,
      user_id: { $in: users }
    }, { session });

    await Notification.deleteMany({
      content_id: id,
      user_id: { $in: users }
    }, { session });

    return {
      success: true,
      result: null,
      revalidateQueue: users
        .map(uid => `isShelfCollaborator-${uid}-${id}`)
        .concat([`shelf-collaborators-${id}`, `shelf-${id}`])
    };
  },
  schema,
  preCheck: async ({ params, user_id }) => {

    const { id } = params;

    const shelf = await Shelf.exists({ _id: id, user_id });

    if (!shelf)
      return { success: false, errCode: "unauthorized_access" }

    return { success: true };
  },
});
