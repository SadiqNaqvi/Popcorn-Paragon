"use client";

import { CheckBoxIcon, EmptyBoxIcon } from "@assets/Icons";
import appToast from "@lib/frontend/providers/appToast";
import { Frame } from "@type/internal";
import { FunctionComponent, RefObject, useCallback, useImperativeHandle, useRef } from "react";
import { twMerge } from "tailwind-merge";
import InfiniteScroller, { InfiniteScrollerProps } from "./InfiniteScroller";
import SearchInList, { QueryFnReturn } from "./SearchInList";
import { ParloImage, ParloImageFrameType } from "./ui";
import { GeneralBarSkeletonList } from "./ui/loading";

/* ---------------------------------- Types --------------------------------- */

export type ListSelectorRef<R = string> = () => R[];

export type RefinedValues<R = unknown> = {
    title: string;
    poster: string | Frame | undefined;
    id: string;
    returnVal?: R;
};

type Response = { _id?: string; id?: string;[key: string]: unknown };

type ComponentToRender<T, R> = FunctionComponent<T & { checked: boolean; onClick: (v: R) => void; }>;

type InfiniteQueryProps<T, R> = {
    mode: "infinite";
    queryKeysForList: string[];
    queryFnForList: (p: number) => QueryFnReturn<T>;
    returnIds?: boolean;
    refiner?: (resp: T) => RefinedValues<R>;
    Component?: ComponentToRender<T, R>;
};

type SearchQueryProps<T, R> = {
    mode: "search";
    queryKeys: (q: string) => string[];
    queryFn: (query: string, page: number) => QueryFnReturn<T>;
    queryKeysForList?: string[];
    queryFnForList?: (p: number) => QueryFnReturn<T>;
    returnIds?: boolean;
    refiner?: (resp: T) => RefinedValues<R>;
    Component?: ComponentToRender<T, R>;
};

type StaticComponentProps<T, R> = {
    mode: "static-component";
    data: T[];
    Component: ComponentToRender<T, R>
    refiner?: (data: T) => RefinedValues<R>;
};

type StaticRefinerProps<T, R> = {
    mode: "static-refiner";
    data: T[];
    returnIds?: boolean;
    Component?: ComponentToRender<T, R>
    refiner?: (data: T) => RefinedValues<R>;
};

type BaseProps<R> = {
    inputPlaceholder?: string;
    callbackRef: RefObject<ListSelectorRef<R> | null>;
    limit?: number;
    className?: string;
    alreadySelectedValues?: { id: string, val?: R }[],
    disabledValues?: string[],
    frameType?: ParloImageFrameType,
    onSelection?: (size: number) => void;
    removeAutoFocus?: boolean;
};

type Props<T extends Response, R> = BaseProps<R> &
    (InfiniteQueryProps<T, R> |
        SearchQueryProps<T, R> |
        StaticComponentProps<T, R> |
        StaticRefinerProps<T, R>) &
    Partial<Pick<InfiniteScrollerProps, "NotFoundSection" | "notFoundMessage">>;

/* -------------------------------- Component -------------------------------- */

type ListSelectorBarProps = RefinedValues & {
    onClick: (id: string, returnVal: any) => void;
    frameType?: ParloImageFrameType;
    defaultChecked?: boolean;
    checked?: boolean;
    className?: string;
    disable?: boolean;
}

export const ListSelectorBar = ({ disable, checked, poster, frameType, className, id, title, defaultChecked, returnVal, onClick }: ListSelectorBarProps) => {

    return (
        <div>
            <label
                htmlFor={id}
                className={twMerge("inline-flex flex-cntr-between w-full capitalize py-2 cursor-pointer", disable ? "brightness-50" : '', className)}
            >

                <input
                    name={id}
                    value={id}
                    checked={checked}
                    type="checkbox"
                    disabled={disable}
                    defaultChecked={defaultChecked}
                    id={id}
                    onChange={() => onClick(id, returnVal)}
                    className="sr-only peer"
                />

                <div className="flex gap-3 items-center">
                    <ParloImage
                        frameType={frameType || "poster"}
                        size={48}
                        alt={`Poster of ${title}`}
                        className="min-w-12 size-12 object-cover"
                        classNameForFallback="min-w-8 size-8 p-1"
                        containerClassName="rounded-full overflow-hidden"
                        frame={poster}
                    />

                    <h6>{title}</h6>
                </div>

                <CheckBoxIcon className="hidden peer-checked:block" />
                <EmptyBoxIcon className="block peer-checked:hidden" />
            </label>
        </div>
    )
}

const ListSelector = <T extends Response, R>(props: Props<T, R>) => {

    const {
        callbackRef,
        className,
        inputPlaceholder,
        limit,
        NotFoundSection,
        notFoundMessage,
        mode,
        alreadySelectedValues,
        frameType,
        Component,
        refiner,
        onSelection,
        removeAutoFocus,
        disabledValues
    } = props;

    /* --------------------------- Selection State --------------------------- */

    const selectedMap = useRef<Map<string, R | true>>(new Map(alreadySelectedValues?.map(({ id, val }) => [id, val ?? true])) || []);
    const disabledValMap = useRef<Map<string, true>>(new Map(disabledValues?.map(el => [el, true])))
    /* -------------------------- Imperative Handle -------------------------- */

    const handleReturn = useCallback((): R[] => {
        if ("returnIds" in props && props.returnIds) {
            return Array.from(selectedMap.current.keys()) as R[];
        }
        return Array.from(selectedMap.current.values()) as R[];
    }, [selectedMap, props]);

    useImperativeHandle(callbackRef, () => handleReturn, [handleReturn]);

    /* ----------------------------- Selection ----------------------------- */

    const handleSelection = useCallback((id: string, returnVal?: R) => {
        const next = new Map(selectedMap.current);

        if (next.has(id)) {
            next.delete(id);
        }

        else if (limit && next.size >= limit) {
            appToast.error(`Only ${limit} selections are allowed.`);
            return;
        }

        else {
            next.set(id, returnVal ?? true);
        }

        onSelection?.(next.size);

        selectedMap.current = next;

    }, [limit]);

    /* ------------------------- Render Item Function ------------------------ */

    const renderItem = useCallback((response: T) => {

        // Static Component Mode
        if (Component) {
            const uid = (response.id || response._id) ?? "";
            const checked = selectedMap.current.has(uid);
            return (
                <Component
                    key={uid}
                    {...response}
                    checked={checked}
                    onClick={(v: R) => handleSelection(uid, v)}
                />
            );
        }

        // Refiner-based modes
        else if (refiner && (
            mode === "static-refiner" ||
            mode === "infinite" ||
            mode === "search"
        )) {
            const refinedValues = refiner(response);

            return (
                <ListSelectorBar
                    {...refinedValues}
                    defaultChecked={selectedMap.current.has(refinedValues.id)}
                    onClick={handleSelection}
                    disable={disabledValMap.current.has(refinedValues.id)}
                    className="pointer w-full"
                    frameType={frameType}
                />
            );
        }

        return null;
    }, [props, handleSelection]);


    /* ------------------------------ Render ------------------------------ */

    if (mode === "infinite") return (
        <InfiniteScroller
            Loading={<GeneralBarSkeletonList rightSideIcon />}
            Component={renderItem}
            fetchData={props.queryFnForList}
            queryKeys={props.queryKeysForList}
            className={className}
            NotFoundSection={NotFoundSection}
            notFoundMessage={notFoundMessage}
        />
    );

    else if (mode === "search") return (
        <SearchInList
            removeAutoFocus={removeAutoFocus}
            Component={renderItem}
            Loading={<GeneralBarSkeletonList rightSideIcon />}
            queryFn={props.queryFn}
            queryKeys={props.queryKeys}
            queryFnForList={props.queryFnForList}
            queryKeysForList={props.queryKeysForList}
            inputPlaceholder={inputPlaceholder}
            className={className}
            NotFoundSection={NotFoundSection}
            notFoundMessage={notFoundMessage}
        />
    );

    else if ((mode === "static-component" || mode === "static-refiner") && props.data.length) return (
        <ul>{props.data.map(renderItem)}</ul>
    )

    return null;
};

export default ListSelector;
