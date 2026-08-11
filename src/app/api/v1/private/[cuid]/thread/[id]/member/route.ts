import {
  deleteHandler,
  getHandler,
  postHandler,
  updateHandler,
} from "@lib/backend/helpers/handlers";
import { Member, Thread, User } from "@model";

// Fetch the member status of the current user in a thread.
export const GET = getHandler(async (_, params) => {

  const { id, cuid } = params;

  const result = await Member.findOne({
    thread_id: id,
    user_id: cuid,
  });

  return { result, success: true };
}
);

// Joining a thread
export const POST = postHandler<{ notification: boolean }>({
  handler: async ({ params, user_id, session, data }) => {
    const { id } = params;
    const { notification } = data;

    await Member.create([{
      thread_id: id,
      user_id,
      notification,
      role: "member"
    }], { session });

    await Thread.findByIdAndUpdate(
      id,
      {
        $inc: { member_count: 1 },
      },
      { session }
    );

    await User.findByIdAndUpdate(
      user_id,
      { $inc: { joinedThreads: 1 } },
      { session }
    );

    return {
      result: true,
      success: true,
      errCode: null,
      available: "threadMembershipMutation_tid_uid",
      options: { tid: id, uid: user_id },
    };
  },
});

// Leaving a thread
export const DELETE = deleteHandler(async ({ user_id, params, session }) => {
  const { id } = params;

  const isDeleted = await Member.findOneAndDelete({ thread_id: id, user_id }, { session });

  if (!isDeleted)
    return { success: false, errCode: "unauthorized_access" }

  await Thread.findByIdAndUpdate(
    id,
    {
      $inc: { member_count: -1 },
    },
    { session }
  );

  await User.findByIdAndUpdate(
    user_id,
    { $inc: { joinedThreads: -1 } },
    { session }
  );

  return {
    success: true,
    available: "threadMembershipMutation_tid_uid",
    options: { tid: id, uid: user_id },
    files: [],
  };
});

// Enabling or disabling the notification for a thread.
export const PATCH = updateHandler<{ notification: boolean }>({
  handler: async ({ user_id, params, session, data }) => {
    const { id } = params;

    await Member.findOneAndUpdate(
      { thread_id: id, user_id },
      { $set: { notification: Boolean(data.notification) } },
      { session }
    );

    return {
      result: null,
      success: true,
      available: "threadMembershipMutation_tid_uid",
      options: { tid: id, uid: user_id },
      files: [],
    };
  },
});
