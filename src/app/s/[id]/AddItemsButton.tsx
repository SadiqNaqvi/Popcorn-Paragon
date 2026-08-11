"use client";

import { BottomSheet, ListSelector, ListSelectorRef } from "@components";
import { searchTaleonsOnly } from "@lib/shared/helpers/external_fetchers";
import { addItemsInShelf } from "@lib/frontend/helpers/mutations";
import { ExtSearchDataTaleonOnly } from "@type/external";
import { AllShelves } from "@type/models";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

const AddItemsButton = ({ sid, uid, className, shelf_type }: { sid: string, uid: string, className?: string, shelf_type: AllShelves }) => {

    const callbackRef = useRef<ListSelectorRef<ExtSearchDataTaleonOnly>>(null);

    const handleSubmit = async () => {
        const items = callbackRef.current?.();
        if (!items || !items.length) return;

        const data = {
            shelf_type,
            items: items.map(({ media_type, poster, title, tmdb_id, year }) => ({
                poster,
                ext_id: tmdb_id,
                taleon_type: media_type,
                title,
                year,
            }))
        };

        await addItemsInShelf(sid, uid, data);
    }

    return (
        <BottomSheet
            onClose={handleSubmit}
            button="Add Items"
            buttonTitle="Add Items"
            className={twMerge("primary", className)}
        >
            <section className="px-2">
                <ListSelector
                    mode="search"
                    callbackRef={callbackRef}
                    queryFn={searchTaleonsOnly}
                    queryKeys={(q) => ["search", "taleonOnly", q]}
                    refiner={(data) => ({
                        id: data.tmdb_id,
                        title: `${data.title} (${data.year})`,
                        poster: data.poster,
                        returnVal: data,
                    })}
                />
            </section>
        </BottomSheet>
    )

}

export default AddItemsButton;