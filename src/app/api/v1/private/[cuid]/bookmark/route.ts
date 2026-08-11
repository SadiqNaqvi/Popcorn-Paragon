import { postHandler, PrecheckFunction } from "@lib/backend/helpers/handlers";
import { bookmarkSchema } from "@lib/shared/validation/schemas";
import { Bookmark, Comment, Connection, Shelf, Post, User } from "@model";
import { ErrorCodes } from "@type/other";
import { BookmarkSchemaType } from "@type/schemas";

// Checking if the current user has been blocked by the author of the content.
const preCheck: PrecheckFunction<BookmarkSchemaType> = async ({ user_id, data }) => {
  const { content_author } = data;

  const isBlocked = await Connection.exists({
    follower: user_id,
    followee: content_author,
    blocked: true,
  });

  if (isBlocked) 
    return { success: false, errCode: "blocked_by_author" as ErrorCodes };

  return { success: true };
};

// Save an item. It could be a post, a comment or a Shelf.
export const POST = postHandler<BookmarkSchemaType>({
  handler: async ({ data, user_id, session }) => {
    const { content_id, content_type } = data;

    await Bookmark.create([{ ...data, user_id, createdAt: Date.now() }], { session });

    const updates = [
      { _id: content_id },
      { $inc: { saved_count: 1 } }
    ]

    let content: any = null;

    if (content_type === "Shelf")
      content = await Shelf.findOneAndUpdate(...updates, { session });

    else if (content_type === "Comment")
      content = await Comment.findOneAndUpdate(...updates, { session });

    else if (content_type === "Post")
      content = await Post.findOneAndUpdate(...updates, { session });

    if (!content)
      return { success: false, errCode: "resource_not_found" }

    await User.findByIdAndUpdate(user_id,
      { $inc: { savedContents: 1 } },
      { session }
    )

    return {
      success: true,
      result: null,
      available: `saved${content_type === "Shelf" ? "Shelve" : content_type}s_uid`,
      options: { uid: user_id },
    };
  },
  schema: bookmarkSchema,
  preCheck,
});
