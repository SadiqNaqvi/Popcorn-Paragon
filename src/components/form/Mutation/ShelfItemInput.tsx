"use client";

import { XmarkIcon } from "@assets/Icons";
import { BottomSheet, BottomSheetRef, ListSelector, ListSelectorRef, RefinedValues } from "@components";
import { Button, OptionalChildren, ShowOnlyShelfItem } from "@components/ui";
import { searchTaleonsOnly } from "@lib/shared/helpers/external_fetchers";
import { ExtSearchDataTaleonOnly } from "@type/external";
import { TaleonSchemaType as ItemType } from "@type/schemas";
import { RefObject, useImperativeHandle, useRef, useState } from "react";

const refiner = ({ media_type, year, title, poster, tmdb_id }: ExtSearchDataTaleonOnly): RefinedValues<ItemType> => ({
    id: tmdb_id,
    title: `${title} (${year})`,
    poster,
    returnVal: {
        ext_id: tmdb_id,
        poster,
        title,
        taleon_type: media_type,
        year,
    } as ItemType
});

const ShallowShelfItemBar = () => (
    <>
        <span className="inline size-12 rounded-full bg-gray40"></span>
        <p>Click here to add items</p>
    </>
)

const ShelfItemInput = ({ itemsRef, defaultTaleons }: { itemsRef: RefObject<ListSelectorRef<ItemType> | null>, defaultTaleons?: ItemType[] }) => {

    const [items, setItems] = useState<ItemType[]>(defaultTaleons ?? []);
    const callbackRef = useRef<ListSelectorRef<ItemType>>(null);
    const sheetRef = useRef<BottomSheetRef>(null);

    useImperativeHandle<ListSelectorRef<ItemType>, ListSelectorRef<ItemType>>(itemsRef, () => () => items)

    const removeItems = (id: string) => {
        setItems(items.filter(e => e.ext_id !== id));
    }

    const getItems = () => {
        const selectedItems = callbackRef.current?.();

        if (!selectedItems || !selectedItems.length) return;

        const uniqueItems = selectedItems.filter(i => !items.some(e => e.ext_id === i.ext_id))
        setItems([...items, ...uniqueItems]);
    }

    return (
        <section className="px-2">
            <BottomSheet
                className="w-full p-2 border border-dashed border-gray40 rounded-md items-center gap-2"
                onClose={getItems}
                ref={sheetRef}
                button={<ShallowShelfItemBar />}
                buttonTitle="Add Taleons"
            >
                <section className="px-2">
                    <ListSelector
                        mode="search"
                        alreadySelectedValues={items.map(i => ({ id: i.ext_id, val: i }))}
                        queryFn={searchTaleonsOnly}
                        queryKeys={(q) => ["search", "connection", q]}
                        refiner={refiner}
                        callbackRef={callbackRef}
                        className="space-y-4"
                        inputPlaceholder="Search Taleons"
                    />
                </section>
            </BottomSheet>

            <OptionalChildren condition={items.length}>
                <ul className="space-y-2 mt-2">
                    {items.map(item => (
                        <li key={item.ext_id} className="inline-flex gap-2 flex-cntr-between px-2 w-full">
                            <ShowOnlyShelfItem {...item} />

                            <Button
                                id={`shelf-remove-${item.title}`}
                                title={`Remove ${item.title}`}
                                className="p-1 bg-gray20 rounded-md"
                                type="button"
                                onClick={() => removeItems(item.ext_id)}
                            >
                                <XmarkIcon className="size-4" />
                            </Button>

                        </li>
                    ))}
                </ul>
            </OptionalChildren>

        </section>
    )
}

export default ShelfItemInput;