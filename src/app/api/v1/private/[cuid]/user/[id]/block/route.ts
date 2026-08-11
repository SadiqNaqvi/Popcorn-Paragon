import { deleteRooms } from "@lib/backend/helpers/deletion";
import { deleteHandler, postHandler } from "@lib/backend/helpers/handlers";
import { Connection, User } from "@model";

// Blocking a user
export const POST = postHandler({
  handler: async ({ params, user_id, session }) => {
    const { id } = params;

    const update = await Connection.updateOne(
      {
        follower: id,
        followee: user_id,
      },
      {
        follower: id,
        followee: user_id,
        blocked: true,
        notification: false,
      },
      { session, upsert: true }
    );

    if (update.modifiedCount) {
      await User.findByIdAndUpdate(
        id,
        {
          $inc: { following: -1 },
        },
        { session }
      );

      await User.findByIdAndUpdate(
        user_id,
        {
          $inc: { followers: -1 },
        },
        { session }
      );
    }

    await deleteRooms({ participants: [id, user_id].sort() }, session);

    return {
      result: null,
      success: true,
      available: "blockUnblock_rid_uid",
      options: { rid: id, uid: user_id },
    };
  },
});

// Unblocking a user
export const DELETE = deleteHandler(async ({ params, user_id }) => {
  const { id } = params;

  await Connection.findOneAndDelete({
    follower: id,
    followee: user_id,
    blocked: true,
  });

  return {
    result: null,
    success: true,
    available: "blockUnblock_rid_uid",
    options: { rid: id, uid: user_id },
    files: [],
  };
});
