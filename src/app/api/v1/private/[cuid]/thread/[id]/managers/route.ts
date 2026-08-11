import { threadManagersLimit } from "@lib/shared/constants";
import { getHandler, postHandler, PrecheckResponse, updateHandler } from "@lib/backend/helpers/handlers";
import { sendNotification } from "@lib/backend/actions/notification";
import { createArrayOfUidsSchema } from "@lib/shared/validation/schemas";
import { Member, Notification, Thread } from "@model";
import { ModeratorType } from "@type/internal";

const schema = createArrayOfUidsSchema(threadManagersLimit);
type SchemaType = { users: string[] }

// Get Moderators and Invitees of the thread. Only Managers can see it (not even invitees)
type AggregatedResponse = Omit<ModeratorType, "role"> & { role: ModeratorType["role"] | "creator" }

export const GET = getHandler(async (_, params) => {

  const { id, cuid } = params;

  const modsAndInvitees = await Member.aggregate<AggregatedResponse>([
    {
      $match: {
        thread_id: id,
        role: { $in: ["moderator", "moderator_invitee", "creator"] },
      },
    },
    { $limit: threadManagersLimit + 1 },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        pipeline: [{ $project: { username: 1, profile: 1 } }],
        as: "user",
      },
    },
    {
      $addFields: {
        username: { $arrayElemAt: ["$user.username", 0] },
        profile: { $arrayElemAt: ["$user.profile", 0] },
      },
    },
    { $project: { user: 0 } },
  ]);

  const creator = modsAndInvitees.find(m => m.role === "creator");
  if (!creator) return { success: false, errCode: "resource_not_found" }

  const managers = modsAndInvitees.filter(m => m.role !== "creator");

  if (creator.user_id === cuid || managers.find((m) => m.user_id === cuid && m.role === "moderator"))
    return {
      success: true,
      result: { creator, managers }
    };

  return {
    success: false,
    errCode: "unauthenticated_access",
  }

}
);

// Apply pre-checks to check if the current user is a Manager. Make sure all the invitees are members of the thread.
const precheck = async (tid: string, uid: string, users: string[]): Promise<PrecheckResponse> => {

  const isManager = await Member.exists({
    thread_id: tid,
    user_id: uid,
    role: { $in: ["moderator", "creator"] }
  });

  if (!isManager) {
    console.log("Returning because the user is not a manager");
    return { success: false, errCode: "unauthorized_access" }
  }
  const total = await Member.countDocuments({
    thread_id: tid,
    user_id: { $in: users },
    role: "member"
  });

  if (total !== users.length) {
    console.log("Returning because one the user is not a member");

    return {
      success: false,
      errCode: "custom_error",
      customError: "One or more invited users are not members of the thread."
    }
  }

  return { success: true }
};

// Invite members to become moderator in a thread. Only Managers (creators/mods) can do this.
export const POST = postHandler<SchemaType>({
  handler: async ({ data, username, params, user_id, session }) => {

    const { id } = params;
    const { users } = data;

    await Member.updateMany(
      {
        thread_id: id,
        user_id: { $in: users },
        banned: false,
        role: "member",
      },
      {
        $set: { role: "moderator_invitee" },
      },
      { session }
    );

    const thread = await Thread.findOne({ _id: id }, { name: 1, poster: 1 }).exec();

    if (!thread)
      return { success: false, errCode: "resource_not_found" }

    await sendNotification(
      users,
      {
        title: `${username} has invited you to become a manager of thread`,
        path: "/notifications",
        poster: thread.poster?.path,
        message: [
          { type: "link", label: username, path: `/u/${username}` },
          {
            type: "text",
            text: "has invited you to become a manager of thread",
          },
          { type: "link", label: thread.name, path: `/t/${id}` },
        ],
        type: "request",
        metadata: {
          thread_id: id,
          sender_id: user_id,
        },
        request_type: "manager_invitation",
        status: "pending",
      },
      session
    );

    return {
      success: true,
      result: null,
      available: "threadManagersMutation_tid_uid",
      options: { tid: id, uid: user_id },
      revalidateQueue: users.map((u) => `notifications-user-${u}`),
    };
  },
  schema,
  preCheck: async ({ user_id, params, data }) =>
    await precheck(params.id, user_id, data.users),
});

// Demote Managers or Invitees. Should ONLY done by the Creator.
export const PATCH = updateHandler<SchemaType>({
  handler: async ({ data, params, session }) => {

    const { id } = params;
    const { users } = data;

    await Member.updateMany(
      {
        thread_id: id,
        user_id: { $in: users },
      },
      {
        $set: { role: "member" },
      },
      { session }
    );

    await Notification.deleteMany({
      content_id: id,
      user_id: { $in: users }
    }, { session });

    return {
      success: true,
      result: null,
      revalidateQueue: users.map((u) => `member-thread-${id}-user-${u}`),
    };
  },
  preCheck: async ({ user_id, params }) => {
    const resp = await Thread.findById(params.id, { created_by: 1 });
    if (!resp || resp.created_by !== user_id)
      return { success: false, errCode: "unauthorized_access" };
    return { success: true };
  },
  schema,
});