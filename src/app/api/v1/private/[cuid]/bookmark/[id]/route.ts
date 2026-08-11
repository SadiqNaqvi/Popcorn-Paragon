import { deleteHandler, getHandler } from "@lib/backend/helpers/handlers";
import { Bookmark, Comment, Post, Shelf } from "@model";

// Check if a content is saved by the current user.
export const GET = getHandler(async (_, params) => {
  const { id, cuid } = params;

  const isSaved = await Bookmark.exists({ content_id: id, user_id: cuid });

  return { success: true, result: Boolean(isSaved) };
});

// Unsave content
export const DELETE = deleteHandler(async ({ params, session, user_id }) => {
  const { id } = params;
  const doc = await Bookmark.findOneAndDelete({ content_id: id, user_id });

  if (!doc) return { success: true, result: null };

  const updates = [
    { _id: doc.content_id },
    { $inc: { saved_count: -1 } }
  ]

  if (doc.content_type === "Shelf")
    await Shelf.findOneAndUpdate(...updates, { session });

  else if (doc.content_type === "Comment")
    await Comment.findOneAndUpdate(...updates, { session });

  else if (doc.content_type === "Post")
    await Post.findOneAndUpdate(...updates, { session });

  return {
    success: true,
    result: null,
    available: "isSaved_uid_id",
    options: { uid: user_id, id },
    files: [],
  };
});
