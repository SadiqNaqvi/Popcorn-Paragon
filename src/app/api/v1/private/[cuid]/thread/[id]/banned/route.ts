import { blockOrBanLimit } from "@lib/shared/constants";
import { getHandler, postHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { usersAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { createArrayOfUidsSchema } from "@lib/shared/validation/schemas";
import { getPageParams } from "@lib/backend/utils";
import { Member, Thread } from "@model";

const schema = createArrayOfUidsSchema(blockOrBanLimit);
type SchemaType = { users: string[] }

// Check if the current user is a Moderator (managers and creator) or not
const validateUser = async (tid: string, uid: string) => {
  const isMod = await Member.exists({
    thread_id: tid,
    user_id: uid,
    role: { $in: ["moderator", "creator"] },
    banned: false,
  });
  return Boolean(isMod);
};

// Get all the banned members of a thread
export const GET = getHandler(async (r, params) => {
  const { id } = params;

  const page = getPageParams(r) - 1;

  const result = await Member.aggregate(
    usersAggregationPipeline({
      filters: [
        {
          $match: { thread_id: id, banned: true },
        },
      ],
      localFieldForLookup: "user_id",
      page,
      sort: { updateAt: -1 },
    })
  );

  return {
    result: result[0] ?? { data: [], total: 0 },
    success: true
  };
});

// Ban users from a thread. Make sure only managers (moderators and creator) can ban a user.
export const PATCH = updateHandler<SchemaType>({
  handler: async ({ data, params, session }) => {
    const { id } = params;

    const updated = await Member.updateMany(
      {
        thread_id: id,
        user_id: { $in: data.users },
        role: "member",
      },
      {
        $set: { banned: true },
      },
      { session }
    );

    await Thread.findByIdAndUpdate(
      id,
      {
        $set: { member_count: -(updated.modifiedCount) },
      },
      { session }
    );

    return {
      success: true,
      result: null,
      revalidateQueue: data.users.map((m) => `member-thread-${id}-user-${m}`),
    };
  },
  preCheck: async ({ params, user_id }) => {
    const isValid = await validateUser(params.id, user_id);
    if (isValid) return { success: true };
    return { success: false, errCode: "unauthorized_access" };
  },
  schema,
});

// Un-ban users from a thread. Make sure only managers (moderators and creator) can un-ban a user.
// POST method because managers can unban multiple users at the same time which is not supported by DELETE method

export const POST = postHandler<SchemaType>({
  handler: async ({ data, params, session }) => {
    const { id } = params;
    const { users } = data;

    await Member.deleteMany(
      {
        thread_id: id,
        user_id: { $in: users },
      },
      { session }
    );

    return {
      success: true,
      result: null,
      revalidateQueue: users.map((m) => `member-thread-${id}-user-${m}`),
    };
  },
  preCheck: async ({ params, user_id }) => {
    const isValid = await validateUser(params.id, user_id);
    if (isValid) return { success: true };
    return { success: false, errCode: "unauthorized_access" };
  },
  schema,
});