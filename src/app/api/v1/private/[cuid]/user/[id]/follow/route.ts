import { sendNotification } from "@lib/backend/actions/notification";
import {
  deleteHandler,
  getHandler,
  postHandler,
  PrecheckFunction,
  updateHandler,
} from "@lib/backend/helpers/handlers";
import { Connection, User } from "@model";

// Check the user-user connection.
export const GET = getHandler(async (_, params) => {
  const requestedUser = params.id;
  const currentUser = params.cuid;

  const result = await Connection.aggregate([
    {
      $facet: {
        isFollower: [
          {
            $match: {
              follower: currentUser,
              followee: requestedUser,
            },
          },
        ],
        isFollowing: [
          {
            $match: {
              followee: requestedUser,
              follower: currentUser,
            },
          },
        ],
      },
    },
  ]);

  const follow: { isFollower: any[]; isFollowing: any[] } = result[0];
  const { isFollower, isFollowing } = follow;

  const follows = isFollower[0];
  const followBack = isFollowing[0];

  const connection = {
    follows: Boolean(follows),
    followBack: Boolean(followBack),
    isBlocked: Boolean(follows && follows.blocked),
    haveBlocked: Boolean(followBack && followBack.blocked),
    notification: Boolean(follows && follows.notification),
  };

  return { result: connection, success: true };
}
);

// Check if the current user is blocked by the requested user;
const preCheck: PrecheckFunction = async ({ params, user_id }) => {
  const { id } = params;

  const isBlocked = await Connection.exists({
    follower: user_id,
    followee: id,
    blocked: true,
  });

  if (isBlocked) return { success: false, errCode: "blocked_by_author" };
  return { success: true };
};

// Following a user.
export const POST = postHandler<{ notification: boolean }>({
  handler: async ({ data, user_id, session, username, params, profile }) => {

    const requestedUser = params.id;
    const { notification } = data;

    await Connection.create(
      [
        {
          follower: user_id,
          followee: requestedUser,
          blocked: false,
          notification,
        },
      ],
      { session }
    );

    await User.findByIdAndUpdate(
      user_id,
      {
        $inc: { following: 1 },
      },
      { session }
    );

    const user = await User.findByIdAndUpdate<{ _id: string }>(
      requestedUser,
      {
        $inc: { followers: 1 },
      },
      { session }
    );

    if (!user) return { success: false, errCode: "invalid_object_id" };

    await sendNotification(
      [user._id],
      {
        title: `${username} started following you`,
        path: `/u/${username}`,
        poster: profile,
        message: [
          { type: "link", label: username, path: `/u/${username}` },
          { type: "text", text: "started following you." },
        ],
      },
      session
    );

    return {
      result: true,
      success: true,
      available: "followUnfollow_rid_uid",
      options: { rid: requestedUser, uid: user_id },
    };
  },
  preCheck,
});

// Unfollowing a user.
export const DELETE = deleteHandler(async ({ user_id, session, params }) => {
  const requestedUser = params.id;

  const doc = await Connection.findOneAndDelete(
    {
      follower: user_id,
      followee: requestedUser,
      blocked: false,
    },
    { session }
  );

  if (!doc)
    return { success: false, errCode: "resource_not_found" };

  await User.findByIdAndUpdate(
    user_id,
    {
      $inc: { following: -1 },
    },
    { session }
  );

  await User.findByIdAndUpdate(
    requestedUser,
    {
      $inc: { followers: -1 },
    },
    { session }
  );

  return {
    result: true,
    success: true,
    errCode: null,
    available: "followUnfollow_rid_uid",
    options: { rid: requestedUser, uid: user_id },
    files: [],
  };
});

// Modifying user notification
export const PATCH = updateHandler<{ notification: boolean }>({
  handler: async ({ params, data, session, user_id }) => {
    const { id } = params;

    await Connection.findOneAndUpdate(
      {
        follower: id,
        followee: user_id,
        blocked: false,
      },
      { $set: data },
      { session }
    );

    return {
      success: true,
      result: null,
      available: "followUnfollow_rid_uid",
      options: { rid: id, uid: user_id },
    };
  },
});
