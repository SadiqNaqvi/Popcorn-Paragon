import { getHandler } from "@lib/backend/helpers/handlers";
import { ShelfItem } from "@model";

// Getting the list of created shelves which hava a specific taleon, id = taleon_id
export const GET = getHandler(async (_, params) => {
  const { id, cuid } = params;

  if (!cuid) return { success: false, errCode: "unauthenticated_access" };

  const shelves = await ShelfItem.find<{ shelf_id: string }>(
    { taleon_id: id, user_id: cuid },
    { shelf_id: 1 }
  );

  return {
    success: true,
    result: {
      shelves: shelves?.map(obj => obj.shelf_id) || []
    }
  };
}
);
