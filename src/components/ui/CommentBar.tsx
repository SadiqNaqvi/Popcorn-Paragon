import { BookmarkIcon, ThumbUpIcon } from "@assets/Icons";
import { Navigate, NavigateComponentProps } from "@components";
import { numberConverter, timeAgo } from "@lib/shared/utils";
import useGlobalStore from "@store/globalStore";
import { CurrentUser, MereComment, ReportedComment, ReportedContent } from "@type/internal";
import { ReplyInputType } from "@type/schemas";
import Image from "next/image";
import { Button, MetadataTile, MetadataTileContainer, OptionalChildren, ParloImage } from "./";

type LinkProps = {
    children: React.ReactNode,
    link: string,
    className?: string,
    status: "sending" | "sent" | undefined,
} & Partial<NavigateComponentProps>

const Link = ({ children, link, className, status, ...args }: LinkProps) => (
    <OptionalChildren condition={status !== "sending"} fallback={<div>{children}</div>}>
        <Navigate
            {...args}
            className={className}
            comp="link"
            goto={link}
        >
            {children}
        </Navigate>
    </OptionalChildren>
)

type Props = MereComment & {
    user: CurrentUser,
    restrictReply?: boolean
}

const ParentCommentBar = ({ parentComment }: { parentComment: ReplyInputType | undefined }) => {

    if (!parentComment || !parentComment.replied_to || !(parentComment.attachment || parentComment.content)) return null;

    const { replied_to, content, attachment } = parentComment;

    if (!content && attachment) return (
        <Navigate
            className="block my-1 p-2 border border-gray20 rounded-md w-full"
            comp="link"
            type="button"
            goto={`/c/${replied_to}`}
            title="Visit Parent Comment"
            aria-label="Visit Parent Comment"
        >
            <p className="mb-1 text-xs sm:text-sm ghostColor">Replied to:</p>
            <div className="w-full">
                <Image
                    height={48}
                    width={48}
                    alt="GIF attached with the comment"
                    src={attachment}
                    unoptimized
                    className="object-contain size-12 rounded-md"
                />
            </div>
        </Navigate>
    )

    else if (content)
        return (
            <Navigate
                title="Visit Parent Comment"
                aria-label="Visit Parent Comment"
                className="block my-1 p-2 border border-gray20 rounded-md w-full"
                comp="link" type="button" goto={`/c/${replied_to}`}>
                <p className="mb-1 text-xs sm:text-sm ghostColor">Replied to:</p>
                <p className="text-sm line-clamp-2">{content}</p>
            </Navigate>
        )

}

const CommentHeader = ({ profile, username, createdAt, edited_at, nsfw, spoiler }: Pick<MereComment, "profile" | "username" | "edited_at" | "nsfw" | "spoiler" | "createdAt">) => (
    <>
        <header className="flex gap-3 items-center">
            <ParloImage
                frameType="userProfile"
                frame={profile}
                className="min-w-10 size-10 object-cover"
                containerClassName="rounded-full overflow-hidden"
                classNameForFallback="size-6"
                size={32}
                alt={`Profile picture of the user - ${username}`}
            />
            <OptionalChildren condition={username} fallback={(
                <span className="text-gray-500 font-semibold">*Deleted User*</span>
            )}>
                <Navigate
                    historyPayload={{
                        title: username,
                        poster: profile,
                        type: "user",
                    }}
                    title={`Visit @${username}`}
                    aria-label={`Visit @${username}`}
                    comp="link"
                    role="button"
                    goto={`/u/${username}`}
                    className="font-semibold"
                >
                    {username}
                </Navigate>
            </OptionalChildren>
        </header>

        <MetadataTileContainer className="mt-2">
            <MetadataTile className="text-xs" condition={!!createdAt}>{timeAgo(createdAt)}</MetadataTile>

            <MetadataTile className="text-xs" condition={!!edited_at}>Edited</MetadataTile>

            <MetadataTile condition={nsfw} className="py-1 px-2 text-xs" nsfw>NSFW</MetadataTile>
            <MetadataTile condition={spoiler} className="py-1 px-2 text-xs" spoiler>Spoiler</MetadataTile>

        </MetadataTileContainer>
    </>
)

export const CommentBody = ({ content, attachment }: Pick<MereComment, "content" | "attachment">) => (
    <>
        <OptionalChildren condition={attachment}>
            <Image
                src={attachment}
                alt="GIF attached with the comment"
                className="size-24 rounded-md border border-gray30 object-contain"
                unoptimized
                height={96}
                width={96}
            />
        </OptionalChildren>
        <p>{content}</p>
    </>
)

const CommentMetadataSection = ({ likes_count, saved_count, restrictReply, post_id, content, attachment, username, status, _id }: Props) => {
    const [, setReply] = useGlobalStore<ReplyInputType | undefined>(`reply:post:${post_id}`, undefined);

    const handleReply = () => {
        if (status === "sending" || restrictReply) return;

        setReply({
            content: content,
            replied_to: _id,
            attachment,
            username,
        })
    }

    return (
        <section className="flex mt-2 gap-3">
            <span className="flex gap-1 text-gray-500">
                <ThumbUpIcon className="h-4" />
                {numberConverter(likes_count)}
            </span>

            <span className="flex gap-1 text-gray-500">
                <BookmarkIcon className="h-4" />
                {numberConverter(saved_count)}
            </span>

            <OptionalChildren condition={status !== "sending"} fallback={<span>Sending...</span>}>
                <OptionalChildren condition={!restrictReply}>
                    <Button
                        title="Reply to this comment"
                        className="smallBtn my-auto border-0"
                        onClick={handleReply}>
                        Reply
                    </Button>
                </OptionalChildren>
            </OptionalChildren>
        </section>
    )
}

const CommentBar = (props: Props) => {
    const {
        _id, attachment, nsfw, spoiler, post_id, content, status, saved_count, likes_count, profile, parentComment, replied_to, username, createdAt, edited_at, restrictReply
    } = props;

    return (
        <article className="w-full my-2 border border-gray10 rounded-md bg-gray10 p-2">
            <details className="w-full p-2" open={!Boolean(nsfw || spoiler)}>

                <summary className="marker:hidden">
                    <CommentHeader createdAt={createdAt} edited_at={edited_at} nsfw={nsfw} spoiler={spoiler} profile={profile} username={username} />
                </summary>

                <ParentCommentBar parentComment={parentComment ? { ...parentComment, replied_to, username: undefined } : undefined} />
                <Link
                    historyPayload={{
                        title: content?.slice(0, 50).concat('...'),
                        poster: profile,
                        image: attachment,
                        type: "comment",
                    }}
                    title={`Visit this comment by ${props.username}`}
                    aria-label={`Visit this comment by ${props.username}`}
                    status={status}
                    link={`/c/${_id}`}
                    className="space-y-4 my-2"
                >
                    <div className="my-2 space-y-4">
                        <CommentBody attachment={attachment} content={content} />
                    </div>
                </Link>
                <CommentMetadataSection {...props} />
            </details>
        </article>
    )

}

export const CommentBarWithoutReply = (comment: Omit<Props, "restrictReply">) => (
    <CommentBar {...comment} restrictReply={true} />
);

export const CommentBarForReport = ({ attachment, content, nsfw, spoiler, profile, username, _id, createdAt }: ReportedComment & ReportedContent["author"] & { _id: string }) => (
    <article className="w-full p-2">
        <CommentHeader createdAt={createdAt} edited_at={undefined} nsfw={nsfw} spoiler={spoiler} profile={profile} username={username} />

        <div className="my-2 space-y-4">
            <Link
                historyPayload={{
                    title: content?.slice(0, 50).concat('...'),
                    poster: profile,
                    image: attachment,
                    type: "comment",
                }}
                status="sent"
                link={`/c/${_id}`}
                className="space-y-4 my-2"
            >
                <CommentBody attachment={attachment} content={content} />
            </Link>
        </div>
    </article>
)

export default CommentBar;