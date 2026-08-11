"use client";

import { SendIcon, XmarkIcon } from "@assets/Icons";
import BottomSheet, { BottomSheetRef } from "@components/BottomSheet";
import { Form, Input, ToggleButton } from "@components/form";
import GiphyComponent from "@components/GiphyComponent";
import { GifResult } from "@giphy/js-fetch-api";
import { createCommentMutation, updateCommentMutation } from "@lib/frontend/helpers/mutations";
import appToast from "@lib/frontend/providers/appToast";
import { parloId } from "@lib/shared/utils";
import { checkEditedFields } from "@lib/frontend/utils";
import useGlobalStore from "@store/globalStore";
import useCurrentUser from "@store/user";
import { FullComment } from "@type/internal";
import { ReplyInputType } from "@type/schemas";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button, OptionalChildren } from "./ui";

export type CommentInputRefType = {
    focus: () => void;
    setValue: (v: string) => void;
}

type Props = {
    section: "replies" | "comments",
    post_id: string,
    post_author: string
} & ({
    editing?: false
    defaultValue?: undefined,
    cid?: string,
} | {
    editing: true,
    defaultValue: FullComment,
    cid: string,
});

type CommentFormData = {
    content: string,
    nsfw: boolean,
    spoiler: boolean
}

const ReplyBar = ({ reply, removeReply }: { reply: ReplyInputType | undefined, removeReply: () => void }) => {

    if (!reply || !reply.replied_to || !(reply.attachment || reply.content)) return null;

    const { attachment, content } = reply;

    if (!content && attachment) return (
        <section className="p-1 border border-gray20 rounded-md">
            <OptionalChildren condition={reply.username}>
                <p className="text-xs mb-1 text-gray-500">Replying to: @{reply.username}</p>
            </OptionalChildren>
            <div className="flex flex-cntr-between gap-2 w-full">
                <Image
                    height={48}
                    width={48}
                    alt="GIF attached with the comment"
                    src={attachment}
                    className="object-contain size-12 rounded-md"
                />
                <Button
                    id="remove-gif-button"
                    title="Remove attachment"
                    onClick={removeReply}
                    className="p-2 rounded-full bg-gray20 border border-gray30">
                    <XmarkIcon className="size-2" />
                </Button>
            </div>
        </section>
    )

    else if (content) return (
        <section className="p-1 border border-gray20 rounded-md">
            <OptionalChildren condition={reply.username}>
                <p className="text-xs mb-1 text-gray-500">Replying to: @{reply.username}</p>
            </OptionalChildren>
            <div className="flex flex-cntr-between gap-2 w-full">
                <p className="text-sm line-clamp-2">{content}</p>
                <Button
                    id="remove-reply-button"
                    title="Remove Reply"
                    onClick={removeReply}
                    className="p-2 rounded-full bg-gray20 border border-gray30">
                    <XmarkIcon className="size-2" />
                </Button>
            </div>
        </section>
    )

}

const setCommentValue = (value: string) => {
    const input = document.querySelector<HTMLInputElement>("input[data-testid=commentInput]");
    if (input) {
        input.value = value;
    }
}

const getElement = () => {
    return document.querySelector<HTMLInputElement>("input[data-testid=commentInput]");
}

const CommentInput = ({ post_author, post_id, section, editing, defaultValue, cid }: Props) => {

    const { meta } = useCurrentUser();
    const [gif, setGif] = useState(defaultValue?.attachment || "");
    const [reply, setReply] = useGlobalStore<ReplyInputType | undefined>(`reply:post:${post_id}`, undefined);
    const gifSheetRef = useRef<BottomSheetRef>(null);
    const sp = useSearchParams();

    if (!meta) return (
        <footer className="py-2 bg-primary border-t border-gray30 sticky bottom-0 w-full fullScreen">
            <Form skipReset submit={() => { appToast.error("Uh Oh! You need to Log-in to comment") }} className="flex gap-2 items-center">

                <Input
                    containerClasses="flex-1"
                    placeholder="Write your comment here..."
                    className={`bg-transparent border-0 py-2 w-full`}
                    name="content"
                />

                <Button
                    id="disabled-submit-comment-button"
                    title="Send"
                    type="submit"
                    className="p-2 h-fit border border-gray10 rounded-full bg-gray10"
                >
                    <SendIcon className="size-4 color-secondary" />
                </Button>
            </Form>
        </footer>
    )

    const handleGif = (data: GifResult["data"]) => {
        setGif(data.images.fixed_height.webp);
        gifSheetRef.current?.close();
    }

    const removeReply = () => setReply(undefined);

    const handleCommentEdit = (newData: Partial<CommentFormData>) => {
        if (!defaultValue || !editing || !cid) return;

        const updatedValues = checkEditedFields(defaultValue, newData);

        updateCommentMutation(cid, meta.user_id, updatedValues, post_id);
    }

    const postComment = async (formData: CommentFormData) => {

        const { content, nsfw, spoiler } = formData;
        if (content.length < 2 && !gif) return;

        if (editing) return handleCommentEdit(formData);

        const parent = reply ? { content: reply.content, attachment: reply.attachment } : undefined;
        const date = new Date();
        const comment = {
            _id: parloId(),
            post_author,
            post_id,
            content,
            likes_count: 0,
            createdAt: date,
            updatedAt: date,
            attachment: gif,
            nsfw, spoiler,
            username: meta.username,
            replied_to: reply?.replied_to,
            parent,
        };

        const parentCommentAuthor = reply?.username
        createCommentMutation(comment, section, sp.get("f") || sp.get("filter"))
            .then(resp => {
                const { success } = resp;
                
                if (success) return;

                const input = getElement();
                
                if (!input) return;

                // Check if user started creating a new comment, if yes then do nothing;
                if (input.value !== "" || reply || gif) return;

                // Otherwise, set the old comment.
                if (comment.content) setCommentValue(comment.content);
                if (comment.attachment) setGif(comment.attachment);
                if (parent)
                    setReply({
                        attachment: parent.attachment,
                        content: parent.content,
                        replied_to: comment.replied_to,
                        username: parentCommentAuthor,
                    })
            });
        setGif("");
        removeReply();
    }

    return (
        <footer className="py-2 bg-primary sticky bottom-0 border-t border-gray20 w-full fullScreen">

            <div className="w-full px-2 space-y-2">

                <ReplyBar reply={reply} removeReply={removeReply} />

                <div className="space-y-2">

                    <OptionalChildren condition={gif}>
                        <div className="relative w-fit">
                            <Button
                                id="select-git-button"
                                title="Attach GIF"
                                onClick={() => setGif('')}
                                className="p-2 border border-gray30 bg-primary rounded-full absolute top-0 right-0 mt-1 mr-1">
                                <XmarkIcon className="size-2" />
                            </Button>
                            <Image
                                unoptimized
                                src={gif}
                                alt="Chosen GIF"
                                className="size-24 rounded-md border border-gray30"
                                height={96}
                                width={96}
                            />
                        </div>
                    </OptionalChildren>

                    <div>
                        <Form
                            submit={postComment}
                            defaultVals={defaultValue}
                            className="w-full group"
                        >
                            <div className="flex gap-2 items-center">

                                <Input
                                    data-testid="commentInput"
                                    containerClasses="flex-1"
                                    placeholder="Write your comment here..."
                                    className={`bg-gray10 border-0 px-0 pl-2 w-full`}
                                    name="content"
                                />

                                <Button
                                    id="submit-comment-button"
                                    title="Send"
                                    type="submit"
                                    className="p-2 h-fit border border-gray10 rounded-full bg-gray10"
                                >
                                    <SendIcon className="size-4 color-secondary" />
                                </Button>
                            </div>

                            <div className="flex gap-2 items-center py-2">

                                <BottomSheet 
                                ref={gifSheetRef}
                                 button="GIF"
                                 buttonTitle="Attach GIF"
                                  className="text-sm py-1 px-2 rounded-md border border-gray40"
                                  >
                                    <GiphyComponent callback={handleGif} />
                                </BottomSheet>

                                <ToggleButton label="nsfw" className="uppercase text-sm bg-transparent" />
                                <ToggleButton label="spoiler" className="capitalize text-sm bg-transparent has-checked:bg-orange-500/20 has-checked:border-orange-500" />
                            </div>
                        </Form>
                    </div>
                </div>
            </div>

        </footer>
    )
}

export default CommentInput;