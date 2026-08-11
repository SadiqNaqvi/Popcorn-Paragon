"use client";

import { AddIcon, RightChevron } from "@assets/Icons";
import { BottomSheet, BottomSheetRef, InfiniteScroller, LoadingButton, Navigate } from "@components";
import { LoginModal } from "@components/fallbacks";
import { ShelfSelector } from "@components/form";
import { getAllShelvesOfUser, getShelvesForTaleon } from "@lib/shared/helpers/internal_fetchers";
import { updateShelvesWithItem } from "@lib/frontend/helpers/mutations";
import { useQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { MereShelf } from "@type/internal";
import { PredefinedShelves } from "@type/models";
import { ConfirmedTaleon } from "@type/schemas";
import { useEffect, useRef, useState } from "react";
import AddToCollaborativeShelf from "./AddToCollaborativeShelf";
import { Button } from "@components/ui";

const buttonClassName = "w-full py-2 flex flex-cntr-between";

type ShelfClickActions = "added" | "removed" | "none";

const AddToShelf = ({ className, taleon, released }: { className?: string, taleon: ConfirmedTaleon, released: boolean }) => {

    const { meta, user } = useCurrentUser();
    const sheetRef = useRef<BottomSheetRef>(null);

    const { data, isFetching, isError, isRefetching, refetch } = useQueryHook({
        queryFn: () => getShelvesForTaleon(taleon.taleon_id, meta?.user_id || ""),
        queryKeys: getQueryKeys("shelfsForTaleon_cnid", { cnid: taleon.taleon_id }),
        enabled: Boolean(meta)
    });

    const [shelfBucket, setShelfBucket] = useState<Map<string, ShelfClickActions>>(new Map());

    useEffect(() => {
        if (!data) return;
        setShelfBucket(new Map(data.shelves.map(id => [id, "none"])))
    }, [data]);

    if (!meta || !user) return (
        <BottomSheet
            className={className}
            button="Add To Shelf"
            buttonTitle="Add To Shelf"
        >
            <LoginModal
                skipFullScreen
                desc={[
                    "Uh Oh! You have been stopped by the Parlocula Cops.",
                    "Looks like you are not logged in",
                    "Don't worry, we got you."
                ]}
            />
        </BottomSheet>
    );

    else if (isFetching && !isRefetching) return <LoadingButton />

    else if (isError || !data) return (
        <Button
            title="Try again"
            id="shelf-try-again-button"
            className="secondary"
            onClick={() => refetch()}
        >
            Try Again
        </Button>
    )

    const { shelves } = data;

    const shelfMap = new Map<string, boolean>(shelves.map(shelf_id => [shelf_id, true]));

    const handleToggle = ({ _id }: { _id: string }) => {
        const tempBucket = new Map(shelfBucket);

        const isAlreadyChecked = Boolean(shelfMap.has(_id));
        const currentCheckedStatus = tempBucket.get(_id);
        const isUntouched = !currentCheckedStatus || currentCheckedStatus === "none";

        if (isAlreadyChecked && isUntouched) {
            tempBucket.set(_id, "removed");
        } else if (isAlreadyChecked && currentCheckedStatus === "removed") {
            tempBucket.set(_id, "none");
        } else if (!isAlreadyChecked && isUntouched) {
            tempBucket.set(_id, "added");
        } else if (!isAlreadyChecked && currentCheckedStatus === "added") {
            tempBucket.set(_id, "none");
        }

        setShelfBucket(tempBucket);
    }

    const ShelfSelectorBar = (props: MereShelf) => {
        const currentStatus = shelfBucket.get(props._id);
        return (
            <ShelfSelector
                {...props}
                onClick={handleToggle}
                checked={(shelfMap.has(props._id) && currentStatus !== "removed") || currentStatus === "added"}
                disabled={!released}
                className="px-0"
            />
        )
    }

    const submit = async () => {
        const add: string[] = [];
        const remove: string[] = [];

        if (!taleon.taleon_id)
            return "Taleon id is required"

        let shelfStatus: Record<PredefinedShelves, ShelfClickActions> = {
            favourite: "none", recommended: "none", watched: "none"
        };

        user.predefinedShelves.forEach(({ _id, name }) => {
            shelfStatus[name] = shelfBucket.get(_id) || "none";
        });

        shelfBucket.entries().forEach(([id, status]) => {
            if (status === "removed") remove.push(id);
            else if (status === "added") add.push(id);
        });

        if (add.length || remove.length || Object.entries(shelfStatus).some(([k, v]) => v !== "none")) {
            await updateShelvesWithItem(
                taleon.taleon_id,
                taleon.taleon_type,
                user._id,
                {
                    ext_id: taleon.ext_id,
                    year: taleon.year,
                    add,
                    remove,
                    ...shelfStatus
                },
            );
        }
    }

    return (
        <BottomSheet
            onClose={submit}
            ref={sheetRef}
            button="Add To Shelf"
            buttonTitle="Add To Shelf"
            className={className}
        >
            <header className="px-2 sticky bottom-0 space-y-2 w-full pb-4 border-b border-gray30">

                <Navigate
                    goto={`/new/shelf?extid=${taleon.ext_id}&type=${taleon.taleon_type}`}
                    comp="link" className={buttonClassName}
                >
                    <div className="flex items-center gap-2">
                        <AddIcon />
                        <span>Create New Shelf</span>
                    </div>
                    <RightChevron />
                </Navigate>

                <AddToCollaborativeShelf
                    taleon={{
                        id: taleon.taleon_id,
                        ext_id: taleon.ext_id,
                        type: taleon.taleon_type,
                        year: taleon.year,
                    }}
                    uid={meta.user_id}
                    className={buttonClassName}
                />
            </header>

            <section className="px-2 space-y-1 my-4">
                <ul className="space-y-2">
                    {user.predefinedShelves.map(s => (
                        <li key={s._id}>
                            <ShelfSelectorBar {...s} />
                        </li>
                    ))}
                </ul>
            </section>
            <section className="px-2 space-y-1 my-4">
                <h4 className="text-xs uppercase">Your Shelves</h4>
                <InfiniteScroller
                    Component={ShelfSelectorBar}
                    fetchData={(p) => getAllShelvesOfUser(meta.user_id, p)}
                    queryKeys={getQueryKeys("allShelvesOfUser_uid", { uid: meta.user_id })}
                    NotFoundSection={(
                        <div className="my-4">
                            <p>Uh oh! Looks like it{"'"}s time to create a new shelf.</p>
                        </div>
                    )}
                    className="space-y-2"
                />
            </section>
        </BottomSheet>
    )

}

export default AddToShelf;