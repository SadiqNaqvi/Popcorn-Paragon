"use client";

import { EmailIcon, FacebookIcon, LinkIcon, MessengerIcon, RedditIcon, ShareIcon, TwitterIcon, WhatsappIcon } from "@assets/Icons";
import BottomSheet, { BottomSheetRef } from "@components/BottomSheet";
import { Form, Input } from "@components/form";
import ListSelector, { ListSelectorRef } from "@components/ListSelector";
import { Button, OptionalChildren } from "@components/ui";
import { parloculaAppURL } from "@lib/shared/constants";
import { getRooms, searchRooms } from "@lib/shared/helpers/internal_fetchers";
import { sendContentToRooms } from "@lib/frontend/helpers/mutations";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { MereRoomType, SearchedRoom } from "@type/internal";
import { PropsWithChildren, useRef, useState } from "react";
import { toast } from "sonner";

type SharingContentProps = { title?: string, path?: string }

const ExternalSharingButton = ({ title, children, onClick }: PropsWithChildren<{ title: string, onClick: () => void }>) => (
    <Button
        id={`ext-sharing-${title}`}
        title={title}
        onClick={onClick}
        className="p-2 last:pr-0 first:pl-0 flex flex-col flex-cntr-all gap-2 min-w-18"
    >
        <span className="p-2 bg-gray30 rounded-full">
            {children}
        </span>
        <p className="text-xs">{title}</p>
    </Button>
)

const ExternalSharingOptionsTray = ({ title, path }: SharingContentProps) => {

    const url = path ? new URL(path, parloculaAppURL).href : window.location.href;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url)
            .then(() => toast.success("Link copied to the clipboard"))
            .catch(() => toast.error("Unable to copy link to the clipboard"))
    }

    const handleFullSharing = () => {
        const data = { title, url }
        if (navigator.canShare && navigator.canShare(data))
            navigator.share(data)
        else toast.error("This feature is not supported in your device.");
    }

    const handleFacebookSharing = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    }

    const handleMessangerSharing = () => {
        window.open(`https://www.facebook.com/dialog/send?link=${url}`, "_blank");
    }

    const handleWhatsappSharing = () => {
        const text = title ? `${title} - ${url}` : url
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }

    const handleMailSharing = () => {
        window.open(`mailto:?body=${encodeURIComponent(url)}${title ? `&subject=${title}` : ''}`, "_blank");
    }

    const handleTwitterSharing = () => {
        window.open(`https://twitter.com/share?url=${encodeURIComponent(url)}${title ? `&text=${title}` : ''}`, "_blank");
    }

    const handleRedditSharing = () => {
        window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}${title ? `&text=${title}` : ''}`, "_blank");
    }

    return (
        <footer className="bg-primary flex gap-2 sticky bottom-0 p-2 border-t border-gray20 overflow-x-auto noScroll mt-4">
            <ExternalSharingButton onClick={handleCopyLink} title="Copy Link">
                <LinkIcon />
            </ExternalSharingButton>
            <ExternalSharingButton onClick={handleFullSharing} title="See All">
                <ShareIcon />
            </ExternalSharingButton>
            <ExternalSharingButton onClick={handleFacebookSharing} title="Facebook">
                <FacebookIcon />
            </ExternalSharingButton>
            <ExternalSharingButton onClick={handleMessangerSharing} title="Messenger">
                <MessengerIcon />
            </ExternalSharingButton>
            <ExternalSharingButton onClick={handleWhatsappSharing} title="Whatsapp">
                <WhatsappIcon />
            </ExternalSharingButton>
            <ExternalSharingButton onClick={handleTwitterSharing} title="X">
                <TwitterIcon />
            </ExternalSharingButton>
            <ExternalSharingButton onClick={handleRedditSharing} title="Reddit">
                <RedditIcon />
            </ExternalSharingButton>
            <ExternalSharingButton onClick={handleMailSharing} title="Mail">
                <EmailIcon />
            </ExternalSharingButton>
        </footer>
    )
}

const ContentSharingSheet = ({ children, className, ...props }: PropsWithChildren<SharingContentProps & { className?: string }>) => {
    const { meta } = useCurrentUser();
    const callbackRef = useRef<ListSelectorRef>(null);
    const [isSelected, setIsSelected] = useState(false);
    const sheetRef = useRef<BottomSheetRef>(null);

    if (!meta) return (
        <BottomSheet
            buttonTitle="Share"
            button={children}
            className={className}
        >
            <section className="space-y-4">
                <div className="w-full h-24 flex flex-cntr-all">
                    <p>Join Parlocula to send this to your friends.</p>
                </div>
                <ExternalSharingOptionsTray {...props} />
            </section>
        </BottomSheet>
    )

    const handleSelectionStart = (size: number) => {
        setIsSelected(size > 0);
    }

    const sendToRooms = async ({ message }: { message: string }) => {
        const rooms = callbackRef.current?.() || [];

        if (!rooms.length) return;

        sendContentToRooms(rooms, {
            contentPath: props.path || `${window.location.pathname}${window.location.search}`,
            message,
        }, meta.user_id, meta.username);
        sheetRef.current?.close();
    }

    return (
        <BottomSheet
            buttonTitle="Share"
            ref={sheetRef}
            onClose={() => setIsSelected(false)}
            button={children}
            className={className}
        >
            <section>
                <div className="px-2">
                    <ListSelector
                        removeAutoFocus
                        queryFnForList={(p) => getRooms(meta.user_id, p)}
                        queryFn={(q, p) => searchRooms(meta.user_id, q, p)}
                        callbackRef={callbackRef}
                        mode="search"
                        queryKeys={(q) => ["search-rooms", q]}
                        queryKeysForList={getQueryKeys("rooms_uid", { uid: meta.user_id })}
                        onSelection={handleSelectionStart}
                        returnIds
                        frameType="userProfile"
                        refiner={(room: SearchedRoom | MereRoomType) => ({
                            id: room._id,
                            title: room.display_name,
                            poster: room.poster
                        })}
                    />
                </div>
                <OptionalChildren condition={isSelected} fallback={(
                    <ExternalSharingOptionsTray {...props} />
                )}>
                    <footer className="flex gap-2 sticky bottom-0 p-2 border-t border-gray20 overflow-x-auto noScroll mt-4">
                        <Form className="w-full space-y-2" submit={sendToRooms} hideLoading>
                            <Input className="border-0" name="message" placeholder="Send Message" maxLength={500} />

                            <Button
                                id="share-message-send"
                                title="Send"
                                className="primary w-full"
                                type="submit"
                            >
                                Send
                            </Button>

                        </Form>
                    </footer>
                </OptionalChildren>
            </section>
        </BottomSheet>
    )

}

export default ContentSharingSheet;