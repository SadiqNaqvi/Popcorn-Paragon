import { parloculaAppURL } from "@lib/shared/constants";
import { updateHandler } from "@lib/backend/helpers/handlers";
import { sendNotification } from "@lib/backend/actions/notification";
import { threadUpdateSchema } from "@lib/shared/validation/schemas";
import { Member, Thread } from "@model";
import { ThreadUpdateSchema } from "@type/schemas";

// Making sure that only managers are allowed to update a thread.
export const PATCH = updateHandler<ThreadUpdateSchema>({
  handler: async ({ data, frames, params, session, username, user_id, isNsfw, areFilesToDelete }) => {

    const dataToUpdate = Object({
      ...data,
      edited_at: new Date(),
      edited_by: username,
      ...(frames.length && { poster: frames[0] }),
    });

    const doc = await Thread.findByIdAndUpdate(
      params.id,
      {
        $set: dataToUpdate,
        ...(!frames.length && areFilesToDelete && { $unset: { poster: 1 } }),
      },
      session
    ).exec();

    if (!doc) return { success: false, errCode: "resource_not_found" }

    const managers = await Member.find(
      { role: { $in: ["creator", "moderator"] }, user_id: { $ne: user_id } },
      { user_id: 1 }
    );

    if (managers.length) {
      await sendNotification(
        managers.map(({ user_id }) => user_id),
        {
          title: `${username} updated the thread ${doc.name}`,
          message: [
            { type: "link", label: username, path: `/u/${username}` },
            { type: "text", text: "updated the thread" },
            { type: "link", label: doc.name, path: `/t/${doc._id}` },
          ],
          poster: doc.poster?.path,
          metadata: { thread_id: doc._id },
          path: `/t/${doc._id}`,
        },
        session
      )
    }

    return {
      success: true,
      available: "threadMutation_tid_uid",
      options: { tid: params.id, uid: user_id },
      result: doc,
      warnTeamParlocula: doc.nsfw || !isNsfw ? undefined : {
        title: "Possibly NSFW Poster of the Thread with incorrect flags",
        desc: "This poster of the thread may be NSFW",
        path: `${parloculaAppURL}/t/${doc._id}`
      }
    };
  },
  preCheck: async ({ user_id, params }) => {
    const { id } = params;

    const isManager = await Member.exists({
      user_id,
      thread_id: id,
      role: { $in: ["moderator", "creator"] },
      banned: false,
    });

    if (isManager) return { success: true };

    return { success: false, errCode: "unauthorized_access" };
  },
  schema: threadUpdateSchema,
});