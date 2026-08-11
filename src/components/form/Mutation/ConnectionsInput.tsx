"use client";

import { AddIcon, XmarkIcon } from "@assets/Icons";
import { BottomSheet, BottomSheetRef, ListSelector, ListSelectorRef, RefinedValues } from "@components";
import { Button, OptionalChildren } from "@components/ui";
import { searchAllContent } from "@lib/shared/helpers/external_fetchers";
import { RefinedSearchData } from "@type/external";
import { InputManagerType } from "@type/other";
import { ThreadConnection as CType } from "@type/internal";
import { RefObject, useImperativeHandle, useRef, useState } from "react";

const refiner = ({ id, media_type, image, name }: RefinedSearchData): RefinedValues<CType> => ({
    id,
    title: name,
    poster: image,
    returnVal: {
        name: name,
        extid: id,
        type: media_type
    } as CType
});

const ConnectionsInput = ({ defaultConnections, connectionsRef }: { defaultConnections?: CType[], connectionsRef: RefObject<InputManagerType<CType[]> | null> }) => {

    const [connections, setConnections] = useState<CType[]>(defaultConnections ?? []);
    const callbackRef = useRef<ListSelectorRef<CType>>(null);
    const sheetRef = useRef<BottomSheetRef>(null);

    useImperativeHandle<InputManagerType<CType[]>, InputManagerType<CType[]>>(connectionsRef, () => ({
        getData: () => connections,
        length: connections.length,
    }));

    const removeConnection = (extid: string) => {
        setConnections(prev => prev.filter(e => e.extid !== extid));
    }

    const getConnections = () => {
        const selectedConnections = callbackRef.current?.();
        if (!selectedConnections || !selectedConnections.length) return;
        setConnections([...connections, ...selectedConnections]);
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-cntr-between">
                <OptionalChildren condition={connections.length} fallback={(
                    <h4 className="parloHeading">Connect to Taleons</h4>
                )}>
                    <ul className="flex gap-3 flex-1 overflow-x-auto noScroll">
                        {connections.map(({ extid, name }) => (
                            <li key={extid} className="inline-flex text-sm gap-3 whitespace-nowrap text-nowrap flex-cntr-between px-2 py-1 rounded-md bg-gray10 border border-gray20">
                                <span>{name}</span>
                                <Button
                                    id={`connection-remove-${name}`}
                                    title={`Remove "${name}" connection`}
                                    className="p-1 bg-gray20 rounded-md"
                                    type="button"
                                    onClick={() => removeConnection(extid)}
                                >
                                    <XmarkIcon className="size-2" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </OptionalChildren>

                <BottomSheet
                    onClose={getConnections}
                    ref={sheetRef}
                    button={<AddIcon />}
                    buttonTitle="Add Connections"
                >
                    <section className="p-2 sm:p-4">
                        <ListSelector
                            mode="search"
                            queryFn={searchAllContent}
                            queryKeys={(q) => ["search", "connection", q]}
                            refiner={refiner}
                            callbackRef={callbackRef}
                            className="space-y-4"
                            inputPlaceholder="Search Movies, Shows or Artists"
                        />
                    </section>
                </BottomSheet>
            </div>
            <OptionalChildren condition={!connections.length}>
                <p className="text-sm text-gray-500">Connect this thread to the movies, shows or artists it is based on. If connected, the thread would be easier to find.</p>
            </OptionalChildren>
        </div>
    )
}

export default ConnectionsInput;