import { parloculaAppURL } from "@lib/shared/constants";
import { deletePosts } from "@lib/backend/helpers/deletion";
import { deleteHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { postUpdateSchema } from "@lib/shared/validation/schemas";
import { Post, Thread, User } from "@model";
import { PostUpdateSchemaType } from "@type/schemas";

// Delete a post;
export const DELETE = deleteHandler(
  async ({ params, session, user_id }) => {
    const { id } = params;

    const posts = await deletePosts({ _id: id, user_id }, session, ["thread_id", "quoted_post_id"]);
    if (!posts.length) return {
      success: false, errCode: "resource_not_found"
    };

    const { thread_id, quoted_post_id } = posts[0];

    await Thread.findByIdAndUpdate(
      thread_id,
      { $inc: { post_count: -1 } },
      { session }
    )

    await User.findByIdAndUpdate(
      user_id,
      { $inc: { posts: -1 } },
      { session }
    );

    if (quoted_post_id) {
      await Post.findByIdAndUpdate(quoted_post_id, {
        $inc: { quoted_count: -1 }
      }, { session })
    }

    return {
      success: true,
      available: "postMutation_pid_tid_uid",
      options: { pid: id, tid: thread_id, uid: user_id },
      files: [],
    };
  }
);

// Update a post;
export const PATCH = updateHandler<PostUpdateSchemaType>({
  handler: async ({ data, frames, params, session, user_id, isNsfw }) => {
    const { id } = params;

    const dataToPost = frames.length ? { ...data, frames, frames_count: frames.length } : data;

    const post = await Post.findOneAndUpdate(
      { _id: id, user_id },
      {
        $set: {
          ...dataToPost,
          edited_at: new Date(),
        },
      },
      { session, new: true }
    ).exec();

    if (!post)
      return { success: false, errCode: "resource_not_found" };

    return {
      success: true,
      available: "postUpdation_pid",
      options: { pid: id },
      result: post,
      warnTeamParlocula: post.nsfw || !isNsfw ? undefined : {
        title: "Possibly NSFW Post with incorrect flags",
        desc: "This Post may contain NSFW Frames while nsfw is set to false.",
        path: `${parloculaAppURL}/p/${post._id}`
      }
    };
  },
  schema: postUpdateSchema,
});
