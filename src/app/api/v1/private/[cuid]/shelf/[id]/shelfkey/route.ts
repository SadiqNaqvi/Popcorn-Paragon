import { updateHandler } from "@lib/backend/helpers/handlers";
import { Shelf } from "@model";

// Updating shelf key of the shelf

export const PATCH = updateHandler({
    handler: async ({ params }) => {

        const { id } = params;

        const newShelfKey = crypto.randomUUID().replaceAll("-", "");

        const shelf = await Shelf.findByIdAndUpdate(id,
            { $set: { shelfKey: newShelfKey } },
            { new: false }
        );

        if (!shelf) return {
            success: false, errCode: "resource_not_found"
        }

        return {
            success: true,
            result: newShelfKey,
            available: "shelfUpdation_sid",
            options: { sid: id }
        }


    },
    preCheck: async ({ params, user_id }) => {
        const { id } = params;

        const shelf = await Shelf.findById(id, { user_id: 1 })
            .exec();

        if (!shelf) return {
            success: false, errCode: "resource_not_found"
        }

        else if (shelf.user_id !== user_id) return {
            success: false, errCode: "unauthorized_access",
        }

        else return { success: true }

    }
})