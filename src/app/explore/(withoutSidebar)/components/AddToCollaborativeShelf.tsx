"use client"

import { CollaborateIcon, RightChevron } from "@assets/Icons";
import { BottomSheet, ListSelector, ListSelectorRef } from "@components";
import { ShelfSelector } from "@components/form";
import { getShelvesAsCollaborator } from "@lib/shared/helpers/internal_fetchers";
import { updateShelvesWithItem } from "@lib/frontend/helpers/mutations";
import { getQueryKeys } from "@lib/shared/utils";
import { MereShelf } from "@type/internal";
import { PredefinedShelves } from "@type/models";
import { useRef } from "react";

type Props = {
    uid: string,
    taleon: {
        id: string;
        type: "movie" | "show";
        ext_id: string,
        year: number,
    },
    className?: string;
}

const AddToCollaborativeShelf = ({ uid, taleon, className }: Props) => {

    const callbackRef = useRef<ListSelectorRef<Pick<MereShelf, "_id" | "shelf_type">>>(null);

    const handleAdding = async () => {
        const { ext_id, id, type } = taleon;

        const shelves = callbackRef.current?.();

        if (!shelves || !shelves.length) return;

        let shelfStatus: Record<PredefinedShelves, "none" | "added"> = {
            favourite: "none", recommended: "none", watched: "none"
        };

        const ids: string[] = [];

        shelves.forEach(shelf => {
            if (shelf.shelf_type !== "custom") {
                shelfStatus[shelf.shelf_type]
            }

            ids.push(shelf._id);
        })

        await updateShelvesWithItem(id, type, uid, {
            ext_id,
            ...shelfStatus,
            remove: [],
            year: taleon.year,
            add: ids,
        });
    }

    return (
        <BottomSheet
            button={(
                <>
                    <div className="flex gap-2 items-center">
                        <CollaborateIcon />
                        <span>Add in Collaborative Shelves</span>
                    </div>
                    <RightChevron />
                </>
            )}
            buttonTitle="Add in Collaborative Shelves"
            className={className}
            onClose={handleAdding}
        >
            <ListSelector
                queryFnForList={(p) => getShelvesAsCollaborator(uid, p)}
                queryKeysForList={getQueryKeys("collaboratedShelvesOfUser_uid", { uid })}
                Component={ShelfSelector as any}
                callbackRef={callbackRef}
                mode="infinite"
            />
        </BottomSheet>
    )

}

export default AddToCollaborativeShelf;