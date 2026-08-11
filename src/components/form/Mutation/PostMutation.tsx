"use client";

import FrameSlider from "@app/p/[id]/(WithHeader)/FrameSlider";
import { AddIcon, BookmarkIcon, CommentIcon, ReactIcon } from "@assets/Icons";
import { BottomSheet, BottomSheetRef, LinkInputManager, Navbar, OptionMenu } from "@components";
import { Form, MediaInputManager, PostCategoryPicker, ToggleButton } from "@components/form";
import ChooseThreadButton from "@components/form/Mutation/ThreadSelectionSheet";
import { Button, OptionalChildren, OptionList } from "@components/ui";
import PostPageMockup from "@components/ui/mockup/PostPageMockup";
import { createPostMutation, updatePostMutation } from "@lib/frontend/helpers/mutations";
import { postClientSchema } from "@lib/shared/validation/schemas";
import { checkEditedFields, readyFrames } from "@lib/frontend/utils";
import useCurrentUser from "@store/user";
import { FullPost, Thread } from "@type/internal";
import { InputManagerType } from "@type/other";
import { InputFrame, PostClientSchemaType } from "@type/schemas";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IDS_Heading, IDS_Section, InitialDescriptionSheet, TextAreaInput } from ".";

type Props = {
    defaultVal: FullPost | undefined,
    isEditing: boolean,
    defaultThread: Thread | undefined,
    quotedPost: FullPost | undefined,
}

const PostMutationPage = ({ defaultVal, isEditing, defaultThread, quotedPost }: Props) => {

    const formRef = useRef<HTMLFormElement | null>(null);
    const linksRef = useRef<InputManagerType>(null);
    const framesRef = useRef<InputManagerType<InputFrame[]>>(null);
    const thread_id = useRef(defaultThread?._id || "");
    const threadSelectionSheet = useRef<BottomSheetRef>(null);

    const mediaPromptRef = useRef<BottomSheetRef>(null);
    const linkPromptRef = useRef<BottomSheetRef>(null);

    const navigation = useRouter();

    const [category, setCategory] = useState(defaultVal?.category ?? "");
    const { meta } = useCurrentUser();

    const addCategory = (category: string) => {
        setCategory(category);
    }

    const submitCreation = async (postData: PostClientSchemaType) => {
        const tid = defaultThread?._id || thread_id.current;

        if (isEditing) return;
        else if (!thread_id) return "Choose a thread to post."
        else if (!meta) return "Log-in to create a post."

        const links = linksRef.current?.getData();
        const frames = framesRef.current?.getData() || [];

        const { files, filesData } = await readyFrames(frames);

        const { success, error } = await createPostMutation(
            meta.user_id,
            {
                ...postData,
                files,
                filesData,
                category,
                thread_id: tid,
                links,
                quoted_post_id: quotedPost?._id,
                quoted_post_author: quotedPost?.user_id,
            },
            navigation
        );

        if (!success) return error;
    }

    const submitUpdation = async (updatedData: PostClientSchemaType) => {
        if (!defaultVal) throw new Error("No data found to update.");
        else if (!meta) return "Log-in to create post.";

        const editedFields = checkEditedFields(defaultVal, updatedData);

        const frames = framesRef.current?.getData() || [];

        const removedFrames = frames.filter(
            ({ isExternal, path }) => !Boolean(frames.find(frame => frame.path === path) || isExternal)
        ).map(({ path, type }) => ({ path, type }));

        const { files, filesData } = await readyFrames(frames);

        const pid = defaultVal._id;

        updatePostMutation(
            pid,
            meta.user_id,
            { ...editedFields, files, filesData, filesToRemove: removedFrames },
            defaultVal.thread_id,
        );
        navigation.replace(`/p/${pid}`);
    };

    const submit = async (data: any) => {
        if (isEditing) return await submitUpdation(data);

        else if (!thread_id.current) {
            threadSelectionSheet.current?.open();
        }

        else return await submitCreation(data);
    }

    const requestSubmit = () => formRef.current?.requestSubmit();

    const takeThreadAndProceed = (tid: string) => {
        thread_id.current = tid;
        requestSubmit();
    }

    const openSheet = (type: "frame" | "link") => {
        if (type === "frame")
            mediaPromptRef.current?.open();
        else
            linkPromptRef.current?.open();
    }

    return (
        <>
            <Navbar
                navTitle={isEditing ? "Edit Post" : "Create Post"}
                OptionButton={(
                    <Button
                        id="submit"
                        title={isEditing ? "Update" : "Create"}
                        className="primary"
                        onClick={requestSubmit}
                    >
                        {isEditing ? "Update" : "Create"}
                    </Button>
                )}
            />

            <Form schema={postClientSchema} className="space-y-4 px-2 sm:px-4" ref={formRef} submit={submit} skipReset>

                <TextAreaInput
                    defaultVal={defaultVal?.title}
                    maxLength={500}
                    minLength={15}
                    name="title"
                    className="text-xl leading-none font-semibold w-full"
                    iconClassName="size-5"
                    placeholder="Title of the Post"
                    required
                    autoFocus
                />

                <section className="flex gap-2 items-center">
                    <ToggleButton checked={defaultVal?.nsfw} label="nsfw" className="uppercase" />
                    <ToggleButton checked={defaultVal?.spoiler} label="spoiler" className="capitalize has-checked:bg-orange-500/20 has-checked:border-orange-500" />
                    <PostCategoryPicker defaultCategory={category} func={addCategory} />
                </section>

                <TextAreaInput
                    defaultVal={defaultVal?.body}
                    maxLength={5000}
                    name="body"
                    placeholder="Description of the post (Optional)"
                    required={false}
                    className="min-h-16"
                />
            </Form>

            <MediaInputManager
                className="mt-4 px-2 sm:px-4"
                allowBoth
                defaultFrames={defaultVal?.frames}
                getterRef={framesRef}
                promptRef={mediaPromptRef}
            />

            <LinkInputManager
                defaultLinks={defaultVal?.links}
                getterRef={linksRef}
                className="mt-4 px-2 sm:px-4"
                promptRef={linkPromptRef}
            />

            <OptionalChildren condition={!isEditing && quotedPost}>
                <section className="my-2">
                    <div className="mx-2 border border-gray50 rounded-md p-2">
                        <p className="text-sm ghostColor">Quoted Post</p>
                        <article className="space-y-4 mt-2">
                            <h4 className="font-semibold line-clamp-2">{quotedPost?.title}</h4>
                            <FrameSlider disablePopping id={quotedPost?._id!} frames={quotedPost?.frames || []} />
                        </article>
                    </div>
                </section>
            </OptionalChildren>

            <ul className="px-2 sm:px-4 flex gap-4 ghostColor w-full pb-4 my-4 border-b border-gray30">
                <li className="flex gap-2">
                    <span className="font-semibold">X</span>
                    <ReactIcon />
                </li>
                <li className="flex gap-2">
                    <span className="font-semibold">X</span>
                    <CommentIcon />
                </li>
                <li className="flex gap-2">
                    <span className="font-semibold">X</span>
                    <BookmarkIcon />
                </li>
            </ul>

            <OptionMenu
                buttonTitle="Attach Frames or Links"
                ButtonElement={<AddIcon className="size-5 sm:size-7" />}
                heading="Attach"
                className="fixed bottom-4 right-4 p-2 bg-secondary color-primary rounded-full"
            >
                <OptionList
                    disable={(framesRef.current?.length || 0) >= 5}
                    onClick={() => openSheet("frame")}>
                    Frame
                </OptionList>
                <OptionList
                    disable={(linksRef.current?.length || 0) >= 5}
                    onClick={() => openSheet("link")}>
                    External Link
                </OptionList>
            </OptionMenu>

            <PostPageMockup />

            <InitialDescriptionSheet>
                <OptionalChildren condition={!isEditing}>
                    <IDS_Section>
                        <IDS_Heading>Before We Continue</IDS_Heading>
                        <div className="space-y-2">
                            <p>This page is designed in such a way that you have the preview of the created post while you fill it.</p>
                            <p> Click on a field to edit it. Title is required to create a post and all other fields are optional.</p>
                        </div>
                    </IDS_Section>
                </OptionalChildren>
                <IDS_Section>
                    <IDS_Heading>Rules</IDS_Heading>
                    <div className="space-y-2">
                        <p>
                            If any of the content in this post, either title, body, frames or links contain NSFW or Spoiler, please mark them accordingly.
                        </p>
                        <p>
                            Wrong flags may lead to temporary or in some cases, permanent ban.
                        </p>
                    </div>
                </IDS_Section>
            </InitialDescriptionSheet>

            <BottomSheet state={false} ref={threadSelectionSheet}>
                <ChooseThreadButton submit={takeThreadAndProceed} defaultVal={defaultThread} />
            </BottomSheet>

        </>
    )
}

export default PostMutationPage;