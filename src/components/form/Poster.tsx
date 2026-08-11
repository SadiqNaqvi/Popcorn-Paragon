"use client";

import { EditIcon } from "@assets/Icons";
import BottomSheet, { BottomSheetRef } from "@components/BottomSheet";
import OptionMenu from "@components/OptionMenu";
import OptionList, { NestedSheetTrigger } from "@components/ui/OptionList";
import { useCustomReducer } from "@lib/frontend/hooks";
import { InputManagerType } from "@type/other";
import { InputFrame } from "@type/schemas";
import Image from "next/image";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { MediaInputPrompt } from "./MediaPicker";

type Props = {
    defaultPoster?: string,
    className?: string,
};

const EditButtonIcon = () => (
    <div className="size-9 flex flex-cntr-all rounded-full border border-slate-500 bg-black/50 text-zinc-100 -mb-1 sm:mb-0 mt-auto -mr-1 sm:mr-0 ml-auto">
        <EditIcon className="size-4" />
    </div>
)

const Poster = forwardRef<InputManagerType<InputFrame | null>, Props>(
    ({ className, defaultPoster }: Props, ref) => {

        const { poster, frame, setter } = useCustomReducer({
            poster: defaultPoster ?? "",
            frame: (defaultPoster ? {
                blob: null,
                isExternal: true,
                path: defaultPoster,
                shouldUpload: false,
                type: "image"
            } : null) as InputFrame | null,
        });

        const sheetRef = useRef<BottomSheetRef>(null);

        useImperativeHandle(ref, () => ({
            getData: () => frame,
            length: 1,
        }));

        const addPoster = (file: InputFrame) => {
            setter({ frame: file, poster: file.path });
            sheetRef.current?.close();
        }

        const removePoster = () => {
            setter({ frame: null, poster: "" });

            sheetRef.current?.close();
        }

        const classNames = twMerge("min-w-24 size-24 sm:min-w-32 sm:size-32 border has-[img]:border-0 border-dashed rounded-full border-zinc-500 relative", className)

        if (!poster) return (
            <div className={classNames}>
                <BottomSheet
                    className="rounded-full flex flex-cntr-all size-full"
                    button={<EditIcon />}
                    buttonTitle="Attach Picture"
                >
                    <MediaInputPrompt type="image" callback={addPoster} />
                </BottomSheet>
            </div>
        )

        return (
            <div className={classNames}>
                <OptionMenu
                    buttonTitle="View Options"
                    sheetRef={sheetRef}
                    ButtonElement={<EditButtonIcon />}
                    className="size-full absolute z-1 rounded-full border border-dashed border-slate-500 flex"
                >
                    <NestedSheetTrigger button="Change">
                        <MediaInputPrompt type="image" callback={addPoster} />
                    </NestedSheetTrigger>
                    <OptionList onClick={removePoster}>
                        Remove
                    </OptionList>
                </OptionMenu>

                <Image
                    width={192}
                    height={192}
                    src={poster}
                    priority
                    alt="Poster for the form"
                    className="size-full rounded-full object-cover"
                />
            </div>
        )
    });

Poster.displayName = "Poster";

export default Poster;