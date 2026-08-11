"use client";

import { AddIcon } from "@assets/Icons";
import { BottomSheetRef, Navbar, OptionMenu } from "@components";
import { Button, MetadataTile, MetadataTileContainer, OptionalChildren, OptionList } from "@components/ui";
import { UserPageMockup } from "@components/ui/mockup";
import { registerUserMutation, updateUser } from "@lib/frontend/helpers/mutations";
import appToast from "@lib/frontend/providers/appToast";
import { checkEditedFields, readyFrames } from "@lib/frontend/utils";
import { registerUserSchemaClient } from "@lib/shared/validation/schemas";
import useCurrentUser from "@store/user";
import { CurrentUser } from "@type/internal";
import { InputManagerType } from "@type/other";
import { InputFrame, LinkSchema, RegisterSchemaClientType } from "@type/schemas";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { DisplayNameInput, IDS_Heading, IDS_Section, InitialDescriptionSheet, TextAreaInput } from ".";
import { Form, LinkInputManager, Poster } from "../";

type CreationProps = {
    username: string;
    dob: Date | undefined;
    email: string;
}

type UpdationProps = {
    defaultValues: Partial<CurrentUser>
}

type Props = (
    ({ isEditing: true } & UpdationProps & Partial<CreationProps>)
    |
    ({ isEditing: false } & CreationProps & Partial<UpdationProps>)
)

const UserMutationPage = ({ username, isEditing, defaultValues, dob, email }: Props) => {

    const profileRef = useRef<InputManagerType<InputFrame>>(null);
    const linkRef = useRef<InputManagerType<LinkSchema[]>>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const linkPromptRef = useRef<BottomSheetRef>(null);

    const navigation = useRouter();
    const urlToRedirect = useSearchParams().get("url");

    const { meta } = useCurrentUser();

    const submitCreation = async (data: { name: string, bio: string }) => {

        if (!dob) return "Date of birth is required";

        else if (!email) throw new Error(`Email is required but got ${email}`);

        else if (!username) throw new Error(`Username is required but got ${username}`);

        const profile = profileRef.current?.getData();

        const { files, filesData } = await readyFrames(profile ? [profile] : []);
        const bioLinks = linkRef.current?.getData() ?? [];

        const redirectTo = urlToRedirect ? urlToRedirect : "/home";

        const { success, error } = await registerUserMutation({
            ...data,
            dob: dob.getTime(),
            email,
            username,
            bioLinks,
            filesData,
            files
        });

        if (!success) return error;

        navigation.replace(redirectTo);
    }

    const submitUpdation = async (data: RegisterSchemaClientType) => {

        if (!meta) {
            appToast.error("You need to log in to perform this action.");
            return;
        }

        const bioLinks = linkRef.current?.getData();
        const profile = profileRef.current?.getData();

        const user = defaultValues;

        if (!user) throw new Error(`default value is required, got: ${defaultValues}`);

        const editedFields = checkEditedFields(
            { ...defaultValues, bioLinks: user.bioLinks, dob: user.dob ? new Date(user.dob).getTime() : undefined },
            { ...data, bioLinks }
        );

        let profileUpdate = {};

        // Check if current profile is same as the default one? if yes then leave it.
        if (profile?.path !== user.profile?.path) {

            // If user had a profile, it is likely removed or changed now. Hence remove the old file from the media host.
            if (user.profile) profileUpdate = { filesToRemove: [{ type: "image", path: user.profile.path }] };

            // If user have chosen a new profile, upload it on the media host.
            if (profile) profileUpdate = { ...profileUpdate, ...(await readyFrames([profile])) }
        }

        const fieldsToUpdate = { ...editedFields, ...profileUpdate };

        if (!Object.keys(fieldsToUpdate).length) return;

        const { success, error } = await updateUser(fieldsToUpdate);
        if (!success) return error;

        navigation.push(`/u/${user.username}`);
    }

    const submit = async (data: any) => {
        if (!isEditing) return await submitCreation(data);
        else return await submitUpdation(data);
    }

    const requestSubmit = () => formRef.current?.requestSubmit();

    return (
        <>
            <Navbar
                navTitle={isEditing ? "Edit Profile" : "Create"}
                OptionButton={(
                    <Button
                        id="submit"
                        title={isEditing ? "Update" : "Join Parlocula"}
                        className="primary"
                        onClick={requestSubmit}
                    >
                        {isEditing ? "Update" : "Join"}
                    </Button>
                )}
            />

            <section className="px-2">
                <Poster ref={profileRef} defaultPoster={defaultValues?.profile?.path} className="absolute" />
            </section>

            <Form
                ref={formRef}
                submit={submit}
                schema={registerUserSchemaClient}
                defaultVals={defaultValues}
                skipReset
                className="px-2"
            >

                <section className="flex gap-4 mb-4 items-center">

                    <div className="min-w-24 size-24 sm:min-w-32 sm:size-32"></div>

                    <div className="space-y-2">
                        <DisplayNameInput
                            maxLength={25}
                            name="name"
                            placeholder="Display Name"
                            required={false}
                            className="text-lg xs:text-xl sm:text-2xl"
                            defaultVal={defaultValues?.name}
                        />
                        <p className="text-sm">@{username || meta?.username}</p>
                    </div>
                </section>

                <MetadataTileContainer className="my-4 gap-3">
                    <MetadataTile skipDisc className="gap-1">
                        <span className="font-semibold">{defaultValues?.posts ?? 'X'}</span>
                        <span className="text-sm">Posts</span>
                    </MetadataTile>
                    <MetadataTile skipDisc className="gap-1">
                        <span className="font-semibold">{defaultValues?.followers ?? 'X'}</span>
                        <span className="text-sm">Followers</span>
                    </MetadataTile>
                    <MetadataTile skipDisc className="gap-1">
                        <span className="font-semibold">{defaultValues?.following ?? 'X'}</span>
                        <span className="text-sm">Following</span>
                    </MetadataTile>
                </MetadataTileContainer>

                <TextAreaInput
                    defaultVal={defaultValues?.bio}
                    maxLength={500}
                    name="bio"
                    placeholder="About Yourself"
                    required={false}
                />
            </Form>

            <OptionMenu
                buttonTitle="Attach Links"
                ButtonElement={<AddIcon className="size-5 sm:size-7" />}
                heading="Attach"
                className="fixed bottom-4 right-4 p-2 bg-secondary color-primary rounded-full"
            >
                <OptionList
                    disable={(linkRef.current?.length || 0) >= 5}
                    onClick={() => linkPromptRef.current?.open()}>Bio Links</OptionList>
            </OptionMenu>

            <LinkInputManager
                defaultLinks={defaultValues?.bioLinks}
                getterRef={linkRef}
                className="mt-2 px-2 sm:px-4"
                promptRef={linkPromptRef}
            />

            <UserPageMockup />

            <InitialDescriptionSheet>
                <OptionalChildren condition={!isEditing}>
                    <IDS_Section>
                        <IDS_Heading>Before We Continue</IDS_Heading>
                        <div className="space-y-2">
                            <p>This page is designed in such a way that you have the preview of the created profile while you fill it.</p>
                            <p> Click on a field to edit it or you can skip it for now and update your profile later.</p>
                        </div>
                    </IDS_Section>
                </OptionalChildren>
                <IDS_Section>
                    <IDS_Heading>Rules</IDS_Heading>
                    <div className="space-y-2">
                        <p>Do not choose a NSFW Display name as it may get you banned.</p>
                        <p>Do not choose a NSFW image for your profile picture.</p>
                    </div>
                </IDS_Section>
            </InitialDescriptionSheet>

        </>
    )
}

export default UserMutationPage;