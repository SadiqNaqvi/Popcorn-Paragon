import { queryLimit } from "@lib/shared/constants";
import { getHandler } from "@lib/backend/helpers/handlers";
import { getPageParams } from "@lib/backend/utils";
import Notification from "@model/notifications";

// Get all the notifications of the current user.
export const GET = getHandler(async (r, params) => {
  const page = getPageParams(r) - 1;

  const { cuid } = params;

  const response = await Notification.aggregate([
    { $match: { user_id: cuid } },
    {
      $facet: {
        total: [{ $count: "count" }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: page * queryLimit },
          { $limit: queryLimit },
        ],
      },
    },
    {
      $project: {
        data: 1,
        total: { $arrayElemAt: ["$total.count", 0] },
      },
    },
  ]);

  const result = response[0] ?? { data: [], total: 0 };

  return { success: true, result };
});
