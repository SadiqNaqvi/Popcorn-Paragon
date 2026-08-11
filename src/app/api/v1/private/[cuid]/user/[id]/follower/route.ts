import { deleteHandler } from "@lib/backend/helpers/handlers";
import { Connection, User } from "@model";

// Removing a follower
export const DELETE = deleteHandler(async ({ params, user_id, session }) => {
  const { id } = params;

  const doc = await Connection.findOneAndDelete(
    {
      follower: id,
      followee: user_id,
      blocked: false,
    },
    { session }
  );

  if (doc) {
    await User.findByIdAndUpdate(
      user_id,
      { $inc: { followers: -1 } },
      { session }
    );

    await User.findByIdAndUpdate(
      id,
      { $inc: { following: -1 } },
      { session }
    );
  }

  return {
    success: true,
    result: null,
    files: [],
    available: "followUnfollow_rid_uid",
    options: { rid: user_id, uid: id },
  };
});