"use client";

import { AlertIcon } from "@assets/Icons";
import BottomSheet, { BottomSheetRef } from "@components/BottomSheet";
import GeneralTile from "@components/GeneralTile";
import { OptionalChildren } from "@components/ui";
import { availablePostCategories } from "@lib/shared/constants";
import { checkAndReturn } from "@lib/shared/utils";
import { TypedFunction } from "@type/other";
import { useRef } from "react";

const PostCategoryPicker = ({ func, defaultCategory = "" }: { func: TypedFunction<string>, defaultCategory?: string }) => {

    const sheetRef = useRef<BottomSheetRef>(null);

    const submitcategory = (category: string) => {
        func(category === "none" ? "" : category);
        sheetRef.current?.close();
    }

    return (
        <BottomSheet
            ref={sheetRef}
            className={`items-center capitalize gap-2 px-2 py-1 text-sm border bg-gray10 rounded-full ${defaultCategory ? "border-secondary" : "border-gray10"}`}
            button={(
                <OptionalChildren condition={defaultCategory} fallback="Category">
                    <AlertIcon className="h-4" />
                    <span className="text-sm">{defaultCategory}</span>
                </OptionalChildren>
            )}
            buttonTitle="Assign Category"
        >
            <section className="px-2">
                {["none", ...availablePostCategories].map(category => (
                    <GeneralTile
                        title={category}
                        key={category}
                        className="capitalize py-2 cursor-pointer"
                        checked={defaultCategory === (checkAndReturn(category, undefined, "none") ?? "")}
                        showCheckBox
                        onClick={() => submitcategory(category)}
                    />
                ))}
            </section>
        </BottomSheet>
    )

}

export default PostCategoryPicker;