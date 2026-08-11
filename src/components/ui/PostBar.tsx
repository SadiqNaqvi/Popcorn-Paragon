import FrameSlider from "@app/p/[id]/(WithHeader)/FrameSlider";
import { BookmarkIcon, CommentIcon, FrameIcon, LinkIcon, ThumbUpIcon } from "@assets/Icons";
import { Navigate } from "@components";
import { makeUrlSafe, numberConverter, timeAgo } from "@lib/shared/utils";
import { MerePost, ReportedContent, ReportedPost } from "@type/internal";
import { BreadCrumbs, BreadCrumbTile, MetadataTile, MetadataTileContainer, ParloImage } from "./";

type SectionType = "thread" | "user";

type Props = { additional?: { section: SectionType } }

const PosterClassName = "object-cover min-w-10 max-w-10 max-h-10 size-10";
const containerClassName = "rounded-full overflow-hidden";
const fallbackClassName = "size-6"

const PostbarBreadCrumbs = ({ poster, profile, thread_id, thread_name, username, section }: Pick<MerePost, | "username" | "profile" | "poster" | "thread_name" | "thread_id"> & { section: SectionType | "all" }) => {

    if (!section || section === "all") return (
        <div className="flex gap-3 items-center">
            <Navigate
                aria-label={`Visit @${username} profile`}
                title={`Visit @${username} profile`}
                comp="link" goto={`/u/${username}`}>
                <ParloImage
                    frameType="userProfile"
                    frame={profile}
                    className={PosterClassName}
                    containerClassName={containerClassName}
                    classNameForFallback={fallbackClassName}
                    size={40}
                    alt={`Profile picture of ${username} - The author of this post`} />
            </Navigate>

            <BreadCrumbs>
                <BreadCrumbTile
                    title={`Visit ${thread_name}`}
                    href={`/t/${thread_id}`}>
                    {thread_name}
                </BreadCrumbTile>
                <BreadCrumbTile
                    title={`Visit ${username}`}
                    href={`/u/${username}`}>
                    {username}
                </BreadCrumbTile>
            </BreadCrumbs>
        </div>
    )

    else if (section === "thread") return (
        <Navigate
            comp="link"
            goto={`/u/${username}`}
            className="flex gap-3 items-center"
        >
            <ParloImage
                frameType="userProfile"
                frame={username ? profile : undefined}
                className={PosterClassName}
                containerClassName={containerClassName}
                classNameForFallback={fallbackClassName}
                size={40}
                alt={`Poster of the thread ${thread_name}`}
            />
            <span className="font-semibold">{username || "Not Found"}</span>
        </Navigate>
    )

    return (
        <Navigate
            aria-label={`Visit ${thread_name}`}
            title={`Visit ${thread_name}`}
            comp="link" goto={`/t/${thread_id}`} className="flex gap-3 items-center">
            <ParloImage
                frameType="groupPoster"
                frame={poster}
                className={PosterClassName}
                containerClassName={containerClassName}
                classNameForFallback={fallbackClassName}
                size={40}
                alt={`Poster of the thread ${thread_name}`}

            />
            <span className="font-semibold">{thread_name}</span>
        </Navigate>

    )

}

const PostHeader = ({ category, nsfw, spoiler, createdAt, poster, profile, thread_id, thread_name, username, additional, edited_at }: Pick<Props & MerePost, "profile" | "poster" | "nsfw" | "spoiler" | "thread_id" | "thread_name" | "username" | "additional" | "category" | "createdAt" | "edited_at">) => (
    <header className="space-y-2">
        <PostbarBreadCrumbs poster={poster} profile={profile} thread_id={thread_id} thread_name={thread_name} username={username} section={additional?.section || "all"} />
        <MetadataTileContainer>
            <MetadataTile>{timeAgo(createdAt)}</MetadataTile>

            <MetadataTile
                condition={!!(category && category !== "none")}
                href={`/t/${thread_id}?c=${category}`}
                className="capitalize">
                {category}
            </MetadataTile>

            <MetadataTile skipDisc className="px-2 py-1 bg-gray10 border-gray20 rounded-md" condition={!!edited_at}>
                Edited: {timeAgo(edited_at!)}
            </MetadataTile>

            <MetadataTile nsfw condition={nsfw}>NSFW</MetadataTile>

            <MetadataTile spoiler condition={spoiler}>Spoiler</MetadataTile>

        </MetadataTileContainer>
    </header>
)

const PostBody = ({ _id, title, frames }: Pick<Props & MerePost, "title" | "_id" | "frames">) => (
    <section className="space-y-4 mb-4">

        <FrameSlider className="my-3" id={_id} frames={frames || []} />

        <h3 className="customize text-lg font-semibold line-clamp-4">{title}</h3>
    </section>
)

const PostMetadataSection = ({ comment_count, frames_count, links_count, reaction_count, saved_count }: Pick<MerePost, "reaction_count" | "comment_count" | "saved_count" | "frames_count" | "links_count">) => {

    const counts = [
        { value: reaction_count, Icon: ThumbUpIcon },
        { value: comment_count, Icon: CommentIcon },
        { value: saved_count, Icon: BookmarkIcon },
    ]

    const metadata = [
        { value: frames_count, Icon: FrameIcon },
        { value: links_count, Icon: LinkIcon },
    ]

    return (
        <section className="flex gap-4 mt-3">
            <ul className="flex gap-3">
                {counts.map(({ Icon, value }, i) => (
                    <li key={i} className="flex items-center gap-1 ghostColor">
                        <Icon className="size-4" />
                        <span>{numberConverter(value || 0)}</span>
                    </li>
                ))}
            </ul>
            <ul className="flex gap-3">
                {metadata.map(({ Icon, value }, i) => (
                    <li key={i} className="flex items-center gap-1 ghostColor">
                        <Icon className="size-4" />
                        <span>{numberConverter(value || 0)}</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

const PostBar = (props: Props & MerePost) => {

    return (
        <article className="p-2 space-y-4 w-full my-2 bg-gray10 border border-gray10 rounded-md">
            <PostHeader {...props} />

            <FrameSlider className="my-3" id={props._id} frames={props.frames || []} />

            <Navigate
                historyPayload={{
                    title: props.title.slice(0, 50).concat('...'),
                    poster: props.additional?.section === "user" ? props.poster : props.profile,
                    image: props.frames?.[0],
                    type: "post",
                }}
                title={`Visit this post by ${props.username}`}
                aria-label={`Visit this post by ${props.username}`}
                role="button"
                comp="link"
                goto={`/p/${props._id}-${makeUrlSafe(props.title)}`}
                className="w-full"
            >
                <h3 className="customize text-lg font-semibold line-clamp-4">{props.title}</h3>

                <PostMetadataSection {...props} />
            </Navigate>

        </article>
    )
}

export const PostBarForReportList = ({ _id, category, createdAt, frames, nsfw, profile, spoiler, title, username }: ReportedPost & ReportedContent["author"] & { _id: string }) => {

    return (
        <article className="px-2 py-4 space-y-4 w-full border-b group-last:border-0 border-gray10">
            <PostHeader
                category={category}
                createdAt={createdAt}
                edited_at={undefined}
                nsfw={nsfw}
                poster={profile}
                profile={profile}
                spoiler={spoiler}
                thread_id=""
                thread_name=""
                username={username}
                additional={{ section: "thread" }}
            />
            <PostBody
                _id={_id}
                title={title}
                frames={frames}
            />

        </article>
    )

}

export default PostBar;