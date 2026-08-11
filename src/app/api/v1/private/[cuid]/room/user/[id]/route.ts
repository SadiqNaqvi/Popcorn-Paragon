import { getHandler } from "@lib/backend/helpers/handlers";
import Room from "@model/rooms";

// Check if there is a room with the requested user and the current user.
export const GET = getHandler(async (_, params) => {
  const { cuid, id } = params;

  const room = await Room.findOne({
    participants: [id, cuid].sort(),
  });

  return { success: true, result: room };
});
