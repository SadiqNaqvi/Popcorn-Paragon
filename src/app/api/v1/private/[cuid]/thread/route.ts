import { postHandler } from "@lib/backend/helpers/handlers";
import { threadSchemaServer } from "@lib/shared/validation/schemas";
import { ThreadSchemaServer } from "@type/schemas";
import { Member, Thread, User } from "@model";
import { parloculaAppURL } from "@lib/shared/constants";

// Creating a thread
export const POST = postHandler<ThreadSchemaServer>({
  handler: async ({ data, frames, user_id, session, isNsfw }) => {
    const { name, description, links, nsfw, connections } =
      data;

    const poster = frames[0];

    const resp = await Thread.create([{
      _id: data._id,
      name,
      description,
      nsfw,
      links,
      created_by: user_id,
      poster,
      connections,
    }], { session });

    const result = resp[0];

    if (!result) return {
      success: false,
      errCode: "data_storing_fail"
    }

    await Member.create(
      [
        {
          thread_id: result._id,
          user_id,
          role: "creator",
        },
      ],
      { session }
    );

    await User.findByIdAndUpdate(user_id, { $inc: { createdThreads: 1 } }, { session })

    return {
      result,
      success: true,
      errCode: null,
      available: "threadMutation_tid_uid",
      options: { tid: result._id, uid: user_id },
      warnTeamParlocula: nsfw || !isNsfw ? undefined : {
        title: "Possibly NSFW Poster of the Thread with incorrect flags",
        desc: "This poster of the thread may be NSFW ",
        path: `${parloculaAppURL}/t/${result._id}`
      }
    };
  },
  schema: threadSchemaServer,
});
