import { addItemsInShelf } from "@lib/backend/utils";
import { postHandler } from "@lib/backend/helpers/handlers";
import { Shelf } from "@model";
import Collaborator from "@model/collaborators";
import { TaleonSchemaType } from "@type/schemas";

// Add item in collaborative shelf
export const POST = postHandler<{ items: TaleonSchemaType[] }>({
    handler: async ({ data, params, user_id, session }) => {

        const { id } = params;
        const { items } = data;

        const shelf = await Shelf.findByIdAndUpdate(id, {
            $inc: {
                item_count: items.length,
                last_order: items.length,
            },
            $set: { last_added: Date.now() }
        }, { session, old: true });

        if (!shelf) return {
            success: false, errCode: "resource_not_found"
        }

        await addItemsInShelf(
            items,
            shelf.last_order + 1,
            "custom",
            id,
            user_id,
            session
        );

        return {
            success: true, result: null, revalidateQueue: []
        }

    },
    preCheck: async ({ params, user_id }) => {
        const { id } = params;
        const exists = await Collaborator.exists({ shelf_id: id, user_id });
        if (exists) return { success: true }
        return { success: false, errCode: "unauthorized_access" }

    }
});