import "server-only";

import { deleteMediaFiles } from "@lib/backend/providers/media";
import { Bookmark, Comment, Like, Message, Participant, Post, Reaction, Room, Shelf, ShelfItem, User } from "@model";
import { BookmarkModelType, CommentModelType, PostModelType, RoomModelType, ShelfModelType } from "@type/models";
import type { ClientSession, QueryFilter } from "@type/mongoose";
import { Query } from "mongoose";

type Doc = { _id: string };

export const deleteBookmarks = async (filter: QueryFilter<BookmarkModelType & Doc>, session: ClientSession): Promise<BookmarkModelType[]> => {
  await Bookmark.deleteMany(filter, { session });
  return [];
};

export const deleteShelfs = async <T extends ShelfModelType & Doc>(filter: QueryFilter<T>, session: ClientSession, project?: Array<keyof T> | null): Promise<T[]> => {

  const defaultFields: Array<keyof T> = ["_id"];

  const projection = project === null ? null : Array.from(new Set((project || []).concat(defaultFields))).join(' ');

  const shelfs = await Shelf.find(filter as any, projection, { session }).exec() as T[];

  if (!shelfs.length) return shelfs as T[];

  const ids: string[] = shelfs.map((el) => el._id).filter(Boolean);

  await ShelfItem.deleteMany({ shelf_id: { $in: ids } }, { session });

  await deleteBookmarks({ content_type: "Shelf", content_id: { $in: ids } }, session);

  await Shelf.deleteMany(filter as any, { session });
  return shelfs as T[];
};

export const deleteComments = async <T extends CommentModelType & Doc>(filter: QueryFilter<T>, session: ClientSession, project?: Array<keyof T> | null): Promise<T[]> => {

  const defaultFields: Array<keyof T> = ["_id"];

  const projection = project === null ? null : Array.from(new Set((project || []).concat(defaultFields))).join(' ');

  const comments = await Comment.find(filter as any, projection, { session }) as T[];

  if (!comments.length) return comments as T[];

  const ids = comments.map((el) => el._id);

  await Like.deleteMany({ _id: { $in: ids } }), { session };

  await deleteBookmarks(
    { content_type: "Comment", content_id: { $in: ids } },
    session
  );

  await Comment.deleteMany(filter as any, { session });
  return comments as T[];
};

export const deletePosts = async <T extends PostModelType & Doc>(filter: QueryFilter<T>, session: ClientSession, project?: Array<keyof T> | null): Promise<T[]> => {

  const defaultFields: Array<keyof T> = ["_id", "frames"];

  const projection = project === null ? null : Array.from(new Set((project || []).concat(defaultFields))).join(' ');
  const posts = await Post.find(
    filter as any,
    projection,
    { session, ordered: true }
  ) as T[];

  if (!posts.length) return posts as T[];

  const paths = posts.flatMap((post) =>
    post.frames
      .filter((frame) => !frame.isExternal)
      .map((path) => path.path)
  );

  await deleteMediaFiles(paths);

  const ids = posts.map((el) => el._id);

  await Reaction.deleteMany({ post_id: { $in: ids } }, { session, ordered: true });

  await deleteComments({ post_id: { $in: ids } }, session);

  await deleteBookmarks({ content_type: "Post", content_id: { $in: ids } }, session);

  await Post.deleteMany(filter as any, { session, ordered: true });

  return posts as T[];
};

export const deleteRooms = async <T extends RoomModelType>(filter: QueryFilter<T & Doc & Doc>, session: ClientSession, project?: Array<keyof T> | null): Promise<T[]> => {

  const defaultFields: Array<keyof T> = ["_id"];

  const projection = project === null ? null : Array.from(new Set((project || []).concat(defaultFields))).join(' ');

  const rooms = await Room.find(filter as any, projection).exec() as T[];

  await Promise.all(
    rooms.map(({ _id }) => [
      Room.findByIdAndDelete(_id, { session }),
      Participant.deleteMany({ room_id: _id }, { session }),
      Message.deleteMany({ room_id: _id }, { session }),
    ]).flatMap(el => el)
  );

  return rooms as T[];

};

export const deleteUser = async (user_id: string, session: ClientSession, profile: string | undefined) => {

  await deleteBookmarks({ user_id }, session);

  await deleteShelfs({ user_id }, session);

  const rooms = await Room.find({ user_id });

  for (const room of rooms) {
    if (!room) continue;

    if (room.type === "private") {
      // If room is a private room, then delete the room as well as all the participants in it.

      await Room.findByIdAndDelete(room._id, { session });
      await Message.deleteMany({ room_id: room._id }, { session });
      await Participant.deleteMany({ room_id: room._id }, { session });
    } else {
      // If room is not a private room, then delete the participant only
      await Participant.deleteOne({ user_id, room_id: room._id }, { session });
    }
  }

  if (profile) deleteMediaFiles(profile);

  await User.findByIdAndDelete(user_id, { session });

}

// A feature for future.
/*
export const timeBasedReversion = async (user_id: string, date: GenericDate, session: ClientSession) => {

  const createdAtFilter = { $gt: new Date(date) };

  const filter = {
    user_id,
    createdAt: createdAtFilter,
  }

  await deletePosts(filter, session);

  await deleteComments(filter, session);

  await deleteBookmarks(filter, session);

  await deleteShelfs(filter, session);

  await Participant.deleteMany(filter, { session });

  await Message.deleteMany(filter, { session });

  await Connection.deleteMany({ follower: user_id, createdAt: createdAtFilter }, { session });

  await Reaction.deleteMany(filter, { session });

  await Like.deleteMany(filter, { session })
}
  */