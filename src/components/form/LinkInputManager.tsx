
"use client";

import { AddIcon, LinkIcon, XmarkIcon } from "@assets/Icons";
import BottomSheet, { BottomSheetRef } from "@components/BottomSheet";
import { Button, OptionalChildren } from "@components/ui";
import { linkSchema } from "@lib/shared/validation/schemas";
import { InputManagerType, TypedFunction } from "@type/other";
import { LinkSchema } from "@type/schemas";
import { useImperativeHandle, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Form, Input } from ".";

export const InputPrompt = ({ submit, className = "", }: { submit: TypedFunction<LinkSchema>, className?: string, }) => {

    return (
        <Form
            className={twMerge("w-full space-y-4 px-2", className)}
            submit={submit}
            schema={linkSchema}
        >
            <Input
                required
                name="label"
                placeholder="label"
            />
            <Input
                required
                name="path"
                placeholder="path"
            />

            <Button
                id="link-prompt-add"
                title="Add"
                className="secondary w-full"
                type="submit"
            >
                Add
            </Button>
        </Form>
    )
}

const linkTileClassName = "flex py-1 px-2 rounded-md bg-gray10 border border-gray-20 border-dashed items-center gap-2 min-w-fit whitespace-nowrap";

const LinkTile = ({ remove, path }: { remove: TypedFunction<string>, path: string }) => (
    <li className={linkTileClassName}>
        <LinkIcon className="size-4" />
        <span className="text-sky-500">{path}</span>
        <Button
            title="Remove"
            onClick={() => remove(path)}
            type="button"
            className=" border border-gray30 bg-gray20 p-1 rounded-md"
        >
            <XmarkIcon className="h-2" />
        </Button>
    </li>
)

const HollowLinkTile = () => (
    <li className={linkTileClassName}>
        <span className="ghostColor">Link</span>
        <AddIcon className="size-4" />
    </li>
)

type Props = {
    title?: string,
    limit?: number,
    defaultLinks?: LinkSchema[],
    getterRef: React.RefObject<InputManagerType<LinkSchema[]> | null>;
    promptRef?: React.RefObject<BottomSheetRef | null>;
    className?: string;
}

const LinkInputManager = ({ title, limit = 5, defaultLinks, getterRef, promptRef, className }: Props) => {

    const [links, setLinks] = useState<LinkSchema[]>(defaultLinks ?? []);

    useImperativeHandle(getterRef, () => ({
        getData: () => links,
        length: links.length,
    }));

    const getLinks = (link: LinkSchema) => {
        if (links.length >= limit || (links.length && links.find(el => el.path === link.path)))
            return;

        setLinks([...links, link]);
        promptRef?.current?.close();
    }

    const removeLinks = (path: string) => {
        setLinks(links.filter(el => el.path !== path));
    }

    if (!links.length) return (
        <BottomSheet
            ref={promptRef}
            buttonTitle="Attach Links"
        >
            <InputPrompt submit={getLinks} />
        </BottomSheet>
    );

    return (
        <section className={twMerge("space-y-2", className)}>
            <OptionalChildren condition={title}>
                <h5>{title}</h5>
            </OptionalChildren>
            <div className="flex gap-2 overflow-x-auto noScroll">
                <ul className="flex gap-2">
                    {links.map(({ path }) => (
                        <LinkTile remove={removeLinks} key={path} path={path} />
                    ))}
                </ul>
                <OptionalChildren condition={links.length < limit}>
                    <ul className="flex gap-2">
                        <BottomSheet
                            ref={promptRef}
                            button={<HollowLinkTile />}
                            buttonTitle="Attach Links"
                        >
                            <InputPrompt submit={getLinks} />
                        </BottomSheet>
                    </ul>
                </OptionalChildren>
            </div>
        </section>
    )

};

export default LinkInputManager;