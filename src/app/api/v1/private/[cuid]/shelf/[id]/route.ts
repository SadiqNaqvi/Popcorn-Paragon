import { deleteShelfs } from "@lib/backend/helpers/deletion";
import { deleteHandler, getHandler, postHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { addItemsInShelf } from "@lib/backend/utils";
import { itemsForShelfSchema, shelfEditSchema } from "@lib/shared/validation/schemas";
import { Shelf, ShelfItem, Collaborators, User } from "@model";
import { FullShelf } from "@type/internal";
import { ItemsForShelfSchemaType, ShelfEditSchemaType } from "@type/schemas";

// Get shelf including private
export const GET = getHandler(async (r, params) => {
  const { id, cuid } = params;

  const uid = cuid === "undefined" ? undefined : cuid;

  const key = r.nextUrl.searchParams.get("k");

  const response = await Shelf.aggregate<FullShelf>([
    {
      $match: { _id: id },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        pipeline: [{ $project: { username: 1 } }],
        as: "user",
      },
    },
    {
      $addFields: {
        username: {
          $arrayElemAt: ["$user.username", 0],
        },
      },
    },
    {
      $project: { user: 0 },
    },
  ]);

  const shelf = response[0];

  if (shelf && shelf.isPrivate && !(shelf.user_id === uid || (key && key === shelf.shelfKey)))
    return { success: false, errCode: "unauthorized_access" };

  return { success: true, result: shelf };
});

// Adding multiple Items in a shelf
// Can only be done by the creator and Collaborators
export const POST = postHandler<ItemsForShelfSchemaType>({
  handler: async ({ params, data, user_id, session }) => {
    const { id } = params;

    const { items, shelf_type } = data;

    const existing = await ShelfItem.find(
      {
        shelf_id: id,
        user_id,
        ext_id: { $in: items.map(el => el.ext_id) },
      },
      { ext_id: 1 },
      { session, order: true }
    ).exec();

    const existingItemsMap = new Map(
      existing.map(el => [el.ext_id, true])
    );

    const itemsToAdd = items.filter(
      (el) => !existingItemsMap.get(el.ext_id)
    );

    const shelf = await Shelf.findByIdAndUpdate(
      id,
      {
        $set: { poster: itemsToAdd.at(-1)?.poster, last_added: new Date() },
        $inc: {
          item_count: itemsToAdd.length,
          last_order: itemsToAdd.length,
        },
      },
      { session, old: true }
    );

    if (!shelf) return {
      success: false,
      errCode: "resource_not_found",
    }

    await addItemsInShelf(
      itemsToAdd,
      shelf.last_order + 1,
      shelf_type,
      id,
      user_id,
      session
    );

    return {
      success: true,
      result: null,
      available: "addItemsInShelf_sid",
      options: { sid: id },
    };
  },
  schema: itemsForShelfSchema,
  preCheck: async ({ user_id, params: { id } }) => {

    const isCreator = await Shelf.exists({ _id: id, user_id });
    if (isCreator) return { success: true }

    const isCollaborators = await Collaborators.exists({ user_id, shelf_id: id });
    if (isCollaborators) return { success: true }

    return { success: false, errCode: "unauthorized_access" }

  }
});

// Editing a shelf and deleting multiple items
// Can only be done by the creator
export const PATCH = updateHandler<ShelfEditSchemaType>({
  handler: async ({ params, data, session }) => {
    const { id } = params;

    const { itemsToDelete, ...update } = data;

    if (itemsToDelete && itemsToDelete.length) {
      await ShelfItem.deleteMany(
        { _id: { $in: itemsToDelete } },
        { session, ordered: true }
      );
    }

    const shelf = await Shelf.findByIdAndUpdate(
      id,
      {
        $set: { ...update },
        $inc: { item_count: -(itemsToDelete?.length ?? 0) },
      },
      { session, ordered: true }
    );

    if (!shelf) return {
      success: false, errCode: "resource_not_found"
    }

    return {
      files: [],
      success: true,
      result: null,
      available: "shelfUpdation_sid",
      options: { sid: id },
    };
  },
  schema: shelfEditSchema,
  preCheck: async ({ user_id, params: { id } }) => {

    const isCreator = await Shelf.exists({ _id: id, user_id });
    if (isCreator) return { success: true }
    return { success: false, errCode: "unauthorized_access" }
  }
});

// Delete a shelf
// Can only be done by the creator;
export const DELETE = deleteHandler(async ({ params, session, user_id }) => {
  const { id } = params;

  const shelf = await deleteShelfs({
    _id: id,
    user_id: user_id
  }, session, ["isPrivate"]);

  if (!shelf.length) return {
    success: false, errCode: "resource_not_found"
  }

  if (!shelf[0]?.isPrivate) {
    await User.findByIdAndUpdate(user_id, { $inc: { publicShelves: -1 } }, { session });
  }

  return {
    files: [],
    available: "shelfMutation_sid_uid",
    options: { sid: id, uid: user_id },
    success: true,
  };
});