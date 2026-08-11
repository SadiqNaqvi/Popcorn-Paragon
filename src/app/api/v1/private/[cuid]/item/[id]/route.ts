import { filterToSort } from "@lib/shared/constants";
import { getHandler, postHandler } from "@lib/backend/helpers/handlers";
import { itemsAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { taleonToAddAndRemove } from "@lib/shared/validation/schemas";
import { getSearchParams } from "@lib/backend/utils";
import { Taleon, Shelf, ShelfItem } from "@model";
import Collaborator from "@model/collaborators";
import { ShelfModelType } from "@type/models";
import { TaleonToAddAndRemoveType } from "@type/schemas";

// Getting items for a shelf (public or private), id = shelf_id
export const GET = getHandler(async (r, params) => {

  const { id, cuid } = params; // shelf_id

  const { page, filter } = getSearchParams(r.nextUrl, 0, "latest");

  const sort = filterToSort.items[filter] ?? filterToSort.items.latest;

  const key = r.nextUrl.searchParams.get("k");

  const shelfResponse = await Shelf.findById(id, { shelfKey: 1, isPrivate: 1, user_id: 1 }).exec();

  if (!shelfResponse) return { success: false, errCode: "resource_not_found" }

  const response = await ShelfItem.aggregate(
    itemsAggregationPipeline({
      filters: [{ $match: { shelf_id: id } }],
      page,
      sort,
      shelf_creator: shelfResponse.user_id,
    })
  );

  const items = response[0];

  if (!items)
    return { success: true, result: { data: [], total: 0 } };

  const shelf = shelfResponse;

  if (shelf.isPrivate && !((key && (key === shelf.shelfKey)) || (cuid && shelf.user_id === cuid)))
    return { success: false, errCode: "unauthorized_access" };

  return { success: true, result: items };
}
);

// Adding/Removing a taleon to/from multiple shelves, id = taleon_id
// Can be done by either a collaborator or the creator
export const POST = postHandler<TaleonToAddAndRemoveType>({
  handler: async ({ data, params, session }) => {

    const { id, cuid } = params;
    const { add, remove, ext_id, year, favourite, recommended, watched } = data;

    const alreadyExisted = Array.from(
      await ShelfItem
        .find({
          taleon_id: id,
          shelf_id: { $in: add }
        }, { shelf_id: 1 }
        )
    )
      .map(({ shelf_id }) => shelf_id);


    const itemsToCreate = add
      .filter(s => !alreadyExisted.includes(s))
      .map((shelf_id) => ({
        shelf_id,
        year,
        ext_id,
        taleon_id: id,
        user_id: cuid,
      }));

    itemsToCreate.forEach(async (item) => {

      const shelf: ShelfModelType | null = await Shelf.findOneAndUpdate(
        { _id: item.shelf_id },
        {
          $inc: {
            item_count: 1,
            order_count: 1
          }
        },
        { session }
      );

      if (shelf)
        await ShelfItem.create([{
          ...item, order: shelf.last_order
        }],
          { session }
        );

    })

    if (remove.length) {

      await ShelfItem.deleteMany({ taleon_id: id, shelf_id: { $in: remove } }, { session });

      await Shelf.updateMany(
        { _id: { $in: remove } },
        { $inc: { item_count: -1 } },
        { session }
      );

    }

    let idsToRevalidate: string[] = [];

    if (favourite !== "none" || recommended !== "none" || watched !== "none") {

      await Taleon.findOneAndUpdate(
        { _id: id },
        {
          $inc: {
            favourite:
              favourite === "added" ? 1 : favourite === "removed" ? -1 : 0,
            watched: watched === "added" ? 1 : watched === "removed" ? -1 : 0,
            recommended:
              recommended === "added" ? 1 : recommended === "removed" ? -1 : 0,
          },
        },
        { session }
      );

      idsToRevalidate.push(`taleon-${ext_id}`);
    }

    return {
      success: true,
      result: null,
      revalidateQueue: idsToRevalidate
        .concat(add.concat(remove).map(id => `itemsOfShelf-${id}`))
        .concat([`shelvesForTaleon-${id}-user-${cuid}`])
    }

  },
  preCheck: async ({ data, user_id }) => {
    const { add, remove } = data;
    const [shelves, collaborators] = await Promise.all([
      Shelf.find({
        _id: { $in: [...add, ...remove] }
      }, { user_id: 1 }),
      Collaborator.find({ user_id, type: "collaborator" }, { shelf_id: 1 }),
    ]);

    if (!shelves.length) return {
      success: false,
      errCode: "resource_not_found"
    }

    const collaboratorMap = new Map(collaborators.map(c => [c.shelf_id, true]));

    const isCreator = shelves.every(shelf => shelf.user_id === user_id);
    const isCollaborator = add.every(sid => collaboratorMap.has(sid));

    if (!(isCreator || isCollaborator)) return {
      success: false,
      errCode: "unauthorized_access"
    }

    return { success: true }

  },
  schema: taleonToAddAndRemove,
});
