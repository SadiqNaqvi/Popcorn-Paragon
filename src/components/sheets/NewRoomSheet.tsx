"use client";

import { SendIcon } from "@assets/Icons";
import { Form, Input } from "@components/form";
import { Button, MessageBar, OptionalChildren, ParloImage } from "@components/ui";
import { createRoomMutation } from "@lib/frontend/helpers/mutations";
import { parloId } from "@lib/shared/utils";
import useGlobalStore from "@store/globalStore";
import useCurrentUser from "@store/user";
import { MereUser } from "@type/internal";
import { useRef } from "react";

const NewRoomSheet = ({ ruser }: { ruser: MereUser }) => {

    const formRef = useRef<HTMLFormElement>(null);
    const { meta } = useCurrentUser();
    const [invitationMessage, setInvitationMessage] = useGlobalStore(`invitationMessage:${ruser._id}`, '');

    if (!meta) return null;

    const createRoom = async ({ content }: { content: string }) => {

        const inviteMessage = content?.trim();
        if (!inviteMessage || !inviteMessage.length) return;
        const ruid = ruser._id;

        const rmid = parloId();
        setInvitationMessage(inviteMessage);

        const { success } = await createRoomMutation(
            rmid,
            {
                files: [],
                filesData: [],
                inviteMessage,
                participants: [ruid],
                type: "private",
                display_name: ruser.username,
                poster: ruser.profile?.path,
            },
            ruid
        );

        if (!success) {
            setInvitationMessage('');
        }
    }

    return (
        <>
            <header className="border-b border-gray20 flex p-2 items-center gap-4">
                <ParloImage
                    frameType="userProfile"
                    className="min-w-12 size-12 object-cover"
                    containerClassName="max-h-12 overflow-hidden rounded-full"
                    classNameForFallback="min-w-8 size-8 p-1"
                    frame={ruser.profile}
                    size={48}
                    alt={`Profile Picture of ${ruser.username}`}
                />

                <h1>{ruser.username}</h1>
            </header>
            <section className="p-4 min-h-[50dvh]">
                <OptionalChildren condition={invitationMessage} fallback={(
                    <p className="text-sm text-center ghostColor">Invite this user to chat with you. You can only send 1 message, make it worth.</p>
                )}>
                    <MessageBar
                        _id=""
                        content={invitationMessage!}
                        createdAt={Date.now()}
                        room_type="private"
                        cuid={meta.user_id}
                        room_id=""
                        user_id={meta.user_id}
                        username={meta.username}
                        seenAt={Date.now() - 86400}
                    />
                </OptionalChildren>
            </section>
            <footer className="w-stretch sticky bottom-0 px-2 py-4">
                <OptionalChildren condition={!invitationMessage} fallback={(
                    <p className="text-center text-sm ghostColor">You have invited @{ruser.username}. Please wait for the acceptance of your invitation.</p>
                )}>
                    <Form
                        ref={formRef}
                        className="flex items-center gap-2"
                        submit={createRoom}>

                        <Input
                            placeholder="Send Message"
                            enterKeyHint="send"
                            name="content"
                            maxLength={3000}
                            containerClasses="flex-1"
                            className="flex-1 border border-invert p-3 bg-transparent rounded-2xl"
                        />

                        <Button
                            id="message-submit"
                            title="Send Message"
                            type="submit"
                            className="size-fit p-2"
                        >
                            <SendIcon />
                        </Button>
                    </Form>
                </OptionalChildren>
            </footer>
        </>
    )

}

export default NewRoomSheet;