"use client";

import { AddIcon } from "@assets/Icons";
import { BottomSheetRef, Navbar, OptionMenu } from "@components";
import { LoginModal } from "@components/fallbacks";
import { Form, LinkInputManager, Poster, ToggleButton } from "@components/form";
import { Button, MetadataTile, MetadataTileContainer, NestedSheetTrigger, OptionalChildren, OptionList } from "@components/ui";
import { ThreadPageMockup } from "@components/ui/mockup";
import { createThreadMutation, editThreadMutation } from "@lib/frontend/helpers/mutations";
import appToast from "@lib/frontend/providers/appToast";
import { threadSchemaClient } from "@lib/shared/validation/schemas";
import { numberConverter, parloId, timeAgo } from "@lib/shared/utils";
import { checkEditedFields, readyFrames } from "@lib/frontend/utils";
import useCurrentUser from "@store/user";
import { Thread, ThreadConnection } from "@type/internal";
import { InputManagerType } from "@type/other";
import { InputFrame, LinkSchema, ThreadSchemaServer, ThreadUpdateSchema } from "@type/schemas";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { DisplayNameInput, IDS_Heading, IDS_Section, InitialDescriptionSheet, TextAreaInput } from ".";
import ConnectionsInput from "./ConnectionsInput";

type Props = {
    isEditing: false;
    defaultValues?: Partial<Thread>;
} | {
    isEditing: true;
    defaultValues: Thread;
}

const ThreadMutation = ({ isEditing, defaultValues }: Props) => {

    const formRef = useRef<HTMLFormElement | null>(null);
    const connectionsRef = useRef<InputManagerType<ThreadConnection[]>>(null);
    const posterRef = useRef<InputManagerType<InputFrame>>(null);
    const linksRef = useRef<InputManagerType<LinkSchema[]>>(null);

    const linkPromptRef = useRef<BottomSheetRef>(null);

    const { meta } = useCurrentUser();
    const navigation = useRouter();

    if (!meta) return <LoginModal />

    const submitCreation = async (data: Pick<ThreadSchemaServer, "name" | "description" | "nsfw">) => {

        const connections = connectionsRef.current?.getData() || [];

        const poster = posterRef.current?.getData();
        const links = linksRef.current?.getData() || [];

        const { files, filesData } = await readyFrames(poster ? [poster] : [])
        const { name, description, nsfw } = data;

        const tid = parloId();

        const finalData = {
            _id: tid,
            name,
            description,
            nsfw,
            links,
            files,
            filesData,
            connections
        }

        const { success, error } = await createThreadMutation(tid, meta.user_id, finalData);

        if (!success) return error;

        navigation.push(`/t/${tid}-${name}`);

    };

    const submitUpdation = async (updatedData: Pick<ThreadUpdateSchema, "name" | "description" | "nsfw">) => {

        if (!isEditing || !meta) return;

        const { poster, links, connections, name, description, nsfw, _id } = defaultValues;

        const updatedConnections = connectionsRef.current?.getData() || [];
        const updatedLinks = linksRef.current?.getData() || [];
        const updatedPoster = posterRef.current?.getData();

        const editedFields = checkEditedFields(
            { name, description, nsfw, connections, links },
            { ...updatedData, connections: updatedConnections, links: updatedLinks }
        )

        let additionalFields: Partial<ThreadUpdateSchema> = {};

        if (updatedPoster?.path !== poster?.path) {

            if (updatedPoster) {
                const { files, filesData } = await readyFrames(updatedPoster);
                additionalFields = {
                    files,
                    filesData,
                }
            }

            if (poster) {
                additionalFields = {
                    ...additionalFields,
                    filesToRemove: [{ type: "image", path: poster.path }]
                }

            }
        }

        const { success, error } = await editThreadMutation(_id, meta.user_id, { ...editedFields, ...additionalFields });

        if (!success) return error;

        appToast.success("Thread Updated Successfully");
        navigation.replace(`/t/${_id}`);

    }

    const submit = async (data: any) => {
        if (!isEditing) return await submitCreation(data);
        else return await submitUpdation(data);
    }

    const requestSubmit = () => {
        formRef.current && formRef.current.requestSubmit();
    }

    return (
        <>
            <Navbar
                navTitle={isEditing ? "Edit Thread" : "Create Thread"}
                OptionButton={
                    <Button
                        id="submit"
                        title={isEditing ? "Update" : "Create"}
                        className="primary"
                        onClick={requestSubmit}
                    >
                        {isEditing ? "Update" : "Create"}
                    </Button>
                }
            />
            <section className="px-2">
                <Poster ref={posterRef} defaultPoster={defaultValues?.poster?.path} className="absolute" />
            </section>
            <Form
                schema={threadSchemaClient}
                ref={formRef}
                submit={submit}
                className="px-2"
                skipReset
            >

                <section className="flex gap-2 md:gap-4 items-center">
                    <div className="min-w-24 size-24 sm:min-w-32 sm:size-32"></div>
                    <div className="flex-1 space-y-1 md:space-y-2">
                        <DisplayNameInput
                            maxLength={30}
                            minLength={6}
                            name="name"
                            placeholder="Display Name"
                            required
                            className="text-lg xs:text-xl sm:text-2xl"
                            defaultVal={defaultValues?.name}
                        />
                        <p className="text-sm ghostColor">Created by: @{isEditing ? defaultValues.creator : meta?.username || "you"}</p>
                    </div>
                </section>

                <section className="flex gap-2 items-center my-4">
                    <ToggleButton checked={defaultValues?.nsfw} label="nsfw" className="uppercase" />
                    <MetadataTileContainer>
                        <MetadataTile>Created {isEditing ? timeAgo(defaultValues.createdAt) : "Now"}</MetadataTile>
                        <MetadataTile>{isEditing ? numberConverter(defaultValues.post_count) : "X"} Members</MetadataTile>
                        <MetadataTile>{isEditing ? numberConverter(defaultValues.post_count) : "X"} Posts</MetadataTile>
                    </MetadataTileContainer>
                </section>

                <TextAreaInput
                    defaultVal={defaultValues?.description}
                    required
                    maxLength={500}
                    name="description"
                    placeholder="Description - about thread, rules, etc."
                />

            </Form>
            <section className="mt-4 px-2 sm:px-4">
                <ConnectionsInput defaultConnections={defaultValues?.connections} connectionsRef={connectionsRef} />
            </section>

            <OptionalChildren condition={(linksRef.current?.length || 0) < 5}>
                <OptionMenu
                    buttonTitle="Attach Links"
                    ButtonElement={<AddIcon className="size-5 sm:size-7" />}
                    heading="Attach"
                    className="fixed bottom-4 right-4 p-2 bg-secondary color-primary rounded-full"
                >
                    <OptionList
                        onClick={() => linkPromptRef.current?.open()}
                    >
                        Links
                    </OptionList>
                </OptionMenu>
            </OptionalChildren>

            <LinkInputManager
                defaultLinks={defaultValues?.links}
                getterRef={linksRef}
                className="mt-4 px-2 sm:px-4"
                promptRef={linkPromptRef}
            />

            <ThreadPageMockup />

            <InitialDescriptionSheet>
                <OptionalChildren condition={!isEditing}>
                    <IDS_Section>
                        <IDS_Heading>Before We Continue</IDS_Heading>
                        <div className="space-y-2">
                            <p>This page is designed in such a way that you have the preview of the created thread while you fill it.</p>
                            <p> Click on a field to edit it. Title and Description are required and all other fields are optional.</p>
                        </div>
                    </IDS_Section>
                    <IDS_Section>
                        <IDS_Heading>Remember</IDS_Heading>
                        <div className="text-sm">
                            <p>A Thread is not a page but a responsibility and it must not be created for competetion, but only when it is needed.</p>
                            <p>If a Thread, for the same purpose already exists, it is recommended not to create a duplicate since creating duplicate threads may flag you as a spammer</p>
                        </div>
                    </IDS_Section>
                </OptionalChildren>
                <IDS_Section>
                    <IDS_Heading>Things to avoid as it may get you banned</IDS_Heading>
                    <div className="text-sm">
                        <p>Choosing a NSFW poster. Poster should be SFW even if the thread is NSFW.</p>
                        <p>NSFW Title. Title should also stay SFW even if the thread is NSFW. You can include the word 'NSFW' in the title for clarification.</p>
                        <p>Creating a duplicate thread for the same purpose</p>
                    </div>
                </IDS_Section>
                <IDS_Section>
                    <IDS_Heading>Recommended things to get your Thread popular</IDS_Heading>
                    <div className="text-sm">
                        <p>Choosing a short and to the point title as they help users to identify the purpose of the thread.</p>
                        <p>A well-defined description that include the purpose of your thread as well as rules if any.</p>
                        <p>Do's and Dont's for memebers should also be mentioned in the description.</p>
                        <p>Keeping the Thread SFW, since NSFW Threads are only shown to those 18+ users who allow NSFW</p>
                    </div>
                </IDS_Section>
            </InitialDescriptionSheet>
        </>
    )

}

export default ThreadMutation;