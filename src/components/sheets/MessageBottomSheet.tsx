import BottomSheet, { BottomSheetRef } from "@components/BottomSheet";
import { MetadataTile, MetadataTileContainer, OptionalChildren } from "@components/ui";
import OptionList from "@components/ui/OptionList";
import { app_production_url } from "@lib/shared/constants";
import { filterDocsInInfiniteQueryResult, retryMessage, unsendMessage } from "@lib/frontend/helpers/mutations";
import { getQueryKeys } from "@lib/shared/utils";
import useGlobalStore from "@store/globalStore";
import useCurrentUser from "@store/user";
import { GenericDate, MereMessage, MessageReplyType } from "@type/internal";
import { MessageSchemaType } from "@type/schemas";
import { PropsWithChildren, useRef } from "react";
import { toast } from "sonner";

const MessageDetailsSection = ({ createdAt, content, status, children }: PropsWithChildren<{ createdAt: GenericDate, content: string, status: string | undefined }>) => {

    return (
        <>
            <section className="mb-4 bg-gray10 border border-gray10 rounded-md p-2 mx-2">
                <MetadataTileContainer>
                    <MetadataTile>{new Date(createdAt).toLocaleString()}</MetadataTile>
                    <MetadataTile condition={!!status}>{status}</MetadataTile>
                </MetadataTileContainer>
                <div className="mt-3 line-clamp-2">{content}</div>
            </section>
            <ul className="sm:bg-gray20 sm:border border-gray10 rounded-md py-4">{children}</ul>
        </>
    )

}

type Props = {
    message: MessageSchemaType & MereMessage | undefined,
    uid: string,
    close: () => void
}

const MessageBottomSheet = () => {

    const { meta } = useCurrentUser();
    const [selectedMessage, setSelectedMessage] = useGlobalStore<MereMessage>("selectedMessage");
    const [_, setReply] = useGlobalStore<MessageReplyType | undefined>(`reply-${selectedMessage?.room_id}`, undefined);
    const sheetRef = useRef<BottomSheetRef>(null);

    if (!selectedMessage || !meta) return null;

    const { status, content, room_id, user_id, _id, createdAt, sharedContent } = selectedMessage;
    const isCurrent = user_id === meta.user_id;

    const handleCopy = () => {
        if (navigator && "clipboard" in navigator) {
            navigator.clipboard.writeText(content)
                .then(() => toast.success("Content copied to clipboard"));
        } else {
            toast.error("Unable to copy text to clipboard");
        }

        sheetRef.current?.close();
    }

    const handleCopyLink = () => {
        if (!sharedContent) return;

        const urlToCopy = sharedContent.startsWith('/') ? new URL(sharedContent, app_production_url).href : sharedContent;
        if (navigator && "clipboard" in navigator) {
            navigator.clipboard.writeText(urlToCopy)
                .then(() => toast.success("Content copied to clipboard"));
        } else {
            toast.error("Unable to copy text to clipboard");
        }

        sheetRef.current?.close();
    }

    const handleRetry = () => {
        retryMessage(selectedMessage._id, room_id, user_id, selectedMessage);

        sheetRef.current?.close();
    }

    const handleReply = () => {
        setReply({ replied_content: content, replied_to: _id });

        sheetRef.current?.close();
    }

    const handleUnsend = () => {
        unsendMessage(room_id, _id, user_id);

        sheetRef.current?.close();
    }

    // To remove messages that couldn't sync because of error
    const handleRemoveMessgage = () => {
        filterDocsInInfiniteQueryResult(
            getQueryKeys("messages_rmid", { rmid: room_id }),
            [_id]
        );
    }

    const removeSelectedMessage = () => setSelectedMessage(undefined)

    if (!isCurrent) return (
        <BottomSheet className="px-2" ref={sheetRef} state onClose={removeSelectedMessage}>
            <MessageDetailsSection content={content} status={status} createdAt={createdAt}>
                <OptionList onClick={handleCopy}>Copy Text</OptionList>
                <OptionalChildren condition={sharedContent}>
                    <OptionList onClick={handleCopyLink}>Copy Link</OptionList>
                </OptionalChildren>
                <OptionList onClick={handleReply}>Reply</OptionList>
            </MessageDetailsSection>
        </BottomSheet>
    )

    if (status === "sending") return (
        <BottomSheet className="px-2" ref={sheetRef} state onClose={removeSelectedMessage}>
            <MessageDetailsSection content={content} status={status} createdAt={createdAt}>
                <OptionList onClick={handleCopy}>Copy Text</OptionList>
            </MessageDetailsSection>
        </BottomSheet>
    )

    else if (status === "error") return (
        <BottomSheet className="px-2" ref={sheetRef} state onClose={removeSelectedMessage}>
            <MessageDetailsSection content={content} status={status} createdAt={createdAt}>
                <OptionList onClick={handleRetry}>Retry</OptionList>
                <OptionList onClick={handleRemoveMessgage}>Unsend</OptionList>
                <OptionList onClick={handleCopy}>Copy Text</OptionList>
            </MessageDetailsSection>
        </BottomSheet>
    )

    else return (
        <BottomSheet className="px-2" ref={sheetRef} state onClose={removeSelectedMessage}>
            <MessageDetailsSection content={content} status={status} createdAt={createdAt}>
                <OptionList onClick={handleReply}>Reply</OptionList>
                <OptionList onClick={handleCopy}>Copy Text</OptionList>
                <OptionalChildren condition={sharedContent}>
                    <OptionList onClick={handleCopyLink}>Copy Link</OptionList>
                </OptionalChildren>
                <OptionList onClick={handleUnsend}>Unsend</OptionList>
            </MessageDetailsSection>
        </BottomSheet>
    )

}

export default MessageBottomSheet;