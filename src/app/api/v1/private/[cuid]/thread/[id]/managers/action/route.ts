import { deleteHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { Member, Notification } from "@model";

// Invitee accepts manager invitation
export const PATCH = updateHandler({
  handler: async ({ user_id, params, session }) => {
    const { id } = params;

    const doc = await Member.findOneAndUpdate(
      { thread_id: id, user_id, role: "moderator_invitee" },
      { $set: { role: "moderator" } },
      { session }
    );

    if (!doc)
      return { success: false, errCode: "resource_not_found" }

    await Notification.findOneAndUpdate(
      { content_id: id, user_id },
      { $set: { status: "accepted" } },
      { session }
    );

    return {
      success: true,
      result: null,
      available: "threadManagersMutation_tid_uid",
      options: { tid: id, uid: user_id },
    };
  }
});

// Invitee rejects manager invitation
export const DELETE = deleteHandler(async ({ user_id, params, session }) => {

  const { id } = params;

  const doc = await Member.findOneAndUpdate(
    { thread_id: id, user_id, role: "moderator_invitee" },
    { $set: { role: "member" } },
    { session }
  );

  if (!doc)
    return { success: false, errCode: "resource_not_found" }

  await Notification.findOneAndUpdate(
    { content_id: id, user_id },
    { $set: { status: "rejected" } },
    { session }
  );
  return {
    success: true,
    result: null,
    available: "threadManagersMutation_tid_uid",
    options: { tid: id, uid: user_id },
  };
});
