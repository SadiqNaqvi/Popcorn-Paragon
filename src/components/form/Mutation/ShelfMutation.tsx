"use client";

import { Navbar } from "@components";
import { LoginModal } from "@components/fallbacks";
import ListSelector, { ListSelectorRef, RefinedValues } from "@components/ListSelector";
import { Button, MetadataTile, MetadataTileContainer, OptionalChildren, ShelfPoster } from "@components/ui";
import { getItems } from "@lib/shared/helpers/internal_fetchers";
import { createShelfMutation, editShelfMutation } from "@lib/frontend/helpers/mutations";
import appToast from "@lib/frontend/providers/appToast";
import { shelfClientSchema, shelfClientUpdateSchema } from "@lib/shared/validation/schemas";
import { getQueryKeys, numberConverter, timeAgo } from "@lib/shared/utils";
import { checkEditedFields } from "@lib/frontend/utils";
import useCurrentUser from "@store/user";
import { FullShelf, ShelfItemType } from "@type/internal";
import { TaleonSchemaType } from "@type/schemas";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { DisplayNameInput, ShelfItemInput } from ".";
import { Form, ToggleButton } from "..";

type CreationProps = {
    defaultVals?: Partial<FullShelf>;
    taleons: TaleonSchemaType[];
}

type UpdationProps = {
    defaultVals: FullShelf;
}

type Props = (
    ({ isEditing: true } & UpdationProps & Partial<CreationProps>)
    |
    ({ isEditing: false } & CreationProps & Partial<UpdationProps>)
)

const refiner = (item: ShelfItemType | TaleonSchemaType): RefinedValues => {

    const { poster, ext_id, title, taleon_id, taleon_type, year } = item;
    return {
        id: ext_id,
        title,
        poster,
        returnVal: {
            ext_id,
            poster,
            taleon_id,
            taleon_type,
            title,
            year,
        } as TaleonSchemaType
    }
}

const ItemsSection = ({ isEditing, itemsRef, defaultVals, taleons, uid }: Omit<Props, "isEditing"> & { itemsRef: React.RefObject<ListSelectorRef<TaleonSchemaType> | null>, uid: string; isEditing: boolean }) => {

    if (isEditing && defaultVals) return (
        <section>
            <h2 className="text-lg mb-4">Select items to delete:</h2>
            <ListSelector
                mode="infinite"
                callbackRef={itemsRef}
                refiner={refiner}
                queryKeysForList={getQueryKeys("itemsOfShelf_sid_filter", { sid: defaultVals._id, filter: "latest" })}
                queryFnForList={(p) => getItems(defaultVals._id, uid, p, "latest")}
            />
        </section>
    )

    else return <ShelfItemInput defaultTaleons={taleons} itemsRef={itemsRef} />
}

const ShelfMutation = ({ defaultVals, taleons, isEditing }: Props) => {

    const { meta } = useCurrentUser();
    const navigation = useRouter();

    const formRef = useRef<HTMLFormElement>(null);
    const itemsRef = useRef<ListSelectorRef<TaleonSchemaType>>(null);

    if (!meta) return <LoginModal />;

    const submitCreation = async (formdata: { name: string, isPrivate: boolean }) => {

        const items = itemsRef.current?.() || [];

        if (!items.length) {
            appToast.error("At least one item is required to create a shelf")
            return;
        }

        const data = { ...formdata, items }

        const { success, error } = await createShelfMutation(meta.user_id, data, navigation);
        if (!success) return error;
    }

    const submitUpdation = async (updatedData: Partial<{ name: string, isPrivate: boolean }>) => {
        if (!isEditing || !defaultVals) return;

        const items = itemsRef.current?.() || [];

        const { name, isPrivate } = updatedData;

        const id = defaultVals._id;

        const editedFields = checkEditedFields(
            { name: defaultVals.name, isPrivate: defaultVals.isPrivate },
            { name, isPrivate }
        );

        const itemsToDelete = items.map(i => i.taleon_id!);

        if (!(itemsToDelete.length || Object.keys(editedFields).length)) return;

        const { success, error } = await editShelfMutation(id, meta.user_id, { ...editedFields, itemsToDelete });
        if (!success) return error;

        navigation.replace(`/s/${id}`);
    }

    const submit = async (data: any) => {
        if (isEditing) return await submitUpdation(data);
        else return await submitCreation(data);
    }

    const reqSubmit = () => formRef.current?.requestSubmit();

    return (
        <>
            <Navbar
                navTitle={isEditing ? "Edit Shelf" : "Create Shelf"}
                OptionButton={(
                    <Button
                        id="submit"
                        title={isEditing ? "Update" : "Create"}
                        className="primary"
                        onClick={reqSubmit}
                    >
                        {isEditing ? "Update" : "Create"}
                    </Button>
                )}
            />

            <Form
                ref={formRef}
                defaultVals={defaultVals}
                submit={submit}
                schema={isEditing ? shelfClientUpdateSchema : shelfClientSchema}
                className="mb-4 px-2 pb-4 border-b border-gray30 space-y-3"
                skipReset
            >
                <section className="flex gap-4 items-center">
                    <ShelfPoster
                        poster={isEditing ? defaultVals.poster : taleons[0]?.poster}
                        name={defaultVals?.name || ''}
                        shelf_type={defaultVals?.shelf_type || "custom"}
                        useClassNameForBoth
                        bigSize
                    />

                    <div className="space-y-2 flex-1">
                        <OptionalChildren condition={!isEditing || defaultVals?.shelf_type === "custom"} fallback={(
                            <h1 className="text-xl font-semibold">{defaultVals?.name}</h1>
                        )}>
                            <DisplayNameInput
                                name="name"
                                autoFocus
                                placeholder="Name - Eg: Fav Horror Movies"
                                minLength={3}
                                maxLength={40}
                                className="sm:text-xl font-semibold leading-none"
                                defaultVal={defaultVals?.name}
                                required
                            />
                        </OptionalChildren>

                        <p className="text-sm ghostColor">Created by @{defaultVals?.username || meta?.username || "you"}</p>
                    </div>

                </section>

                <section className="flex items-center gap-2 my-4">
                    <OptionalChildren condition={!isEditing || defaultVals?.shelf_type !== "recommended"}>
                        <ToggleButton checked={defaultVals?.isPrivate} label="Private" name="isPrivate" />
                    </OptionalChildren>
                    <MetadataTileContainer>
                        <MetadataTile>Created {isEditing ? timeAgo(defaultVals.createdAt) : "Now"}</MetadataTile>
                        <MetadataTile>{isEditing ? numberConverter(defaultVals.item_count) : "X"} Items</MetadataTile>
                    </MetadataTileContainer>
                </section>
            </Form>

            <ItemsSection taleons={taleons} itemsRef={itemsRef} defaultVals={defaultVals} uid={meta?.user_id} isEditing={isEditing} />
        </>
    )
}

export default ShelfMutation;