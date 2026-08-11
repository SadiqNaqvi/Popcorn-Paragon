"use client";

import { CommentIcon, QuoteIcon } from "@assets/Icons";
import { GenericWrapper, Navbar, Navigate, SaveButton } from "@components";
import { ContentFiltered } from "@components/fallbacks";
import { BreadCrumbs, BreadCrumbTile, Button, LinksSection, MetadataTile, MetadataTileContainer, OptionalChildren, ParloImage } from "@components/ui";
import PostPageSkeleton from "@components/ui/loading/PostPageSkeleton";
import { getPostById } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys, makeUrlSafe, numberConverter, timeAgo } from "@lib/shared/utils";
import { FullPost } from "@type/internal";
import FrameSlider from "./FrameSlider";
import OptionsButton from "./OptionsButton";
import ReactionButton from "./ReactionButton";

type Props = {
    id: string;
    uid: string | undefined;
    filterContent: boolean;
}

const getQueryProps = ({ id }: Props) => ({
    queryKeys: getQueryKeys("post_id", { id }),
    args: [id],
    queryFn: getPostById,
});

const handleFocus = () => {
    document.querySelector<HTMLInputElement>("input[data-testid=commentInput]")?.focus();
}

const Component = (data: FullPost, { uid,filterContent }: Props) => {

    const { _id, username, poster, edited_at, user_id, saved_count, thread_name, body, comment_count, quoted_post_frames_count, quoted_post_id, quoted_post_links_count, quoted_post_title, createdAt, frames, links, nsfw, reaction_count, spoiler, category, thread_id, title, } = data;

    return (
        <>
            <OptionalChildren condition={nsfw}>
                <ContentFiltered filterContent={filterContent} allow={uid === user_id} redirectPath={`/p/${_id}`} />
            </OptionalChildren>

            <Navbar
                navTitle="Post"
                titleToShare={`${title.slice(0,100)} - Check out this post by ${username} on Parlocula`}
                OptionButton={<OptionsButton post={data} />}
                className="sticky bg-primary -mt-4 mb-4"
            />

            <article className="px-2">

                <header className="px-2 flex gap-2 items-center">
                    <Navigate comp="link" role="button" goto={`/t/${thread_id}`}>
                        <ParloImage
                            frameType="groupPoster"
                            containerClassName="rounded-full overflow-hidden"
                            classNameForFallback="p-1 size-8"
                            className="min-w-10 size-10"
                            frame={poster}
                            size={32}
                            alt={`Profile picture of the author of the post - ${username}`}
                        />
                    </Navigate>

                    <BreadCrumbs>
                        <BreadCrumbTile href={`/t/${thread_id}-${makeUrlSafe(thread_name)}`}>{thread_name}</BreadCrumbTile>
                        <BreadCrumbTile className={username ? '' : "text-gray-500"} href={username ? `/u/${username}` : undefined}>{username || "Parlocula User"}</BreadCrumbTile>
                    </BreadCrumbs>

                </header>

                <MetadataTileContainer className="my-4 px-2">
                    <MetadataTile>{timeAgo(createdAt)}</MetadataTile>

                    <MetadataTile className="px-2 py-1 rounded-md" condition={!!edited_at}>Edited: {timeAgo(edited_at)}</MetadataTile>

                    <MetadataTile
                        condition={!!(category && category !== "none")}
                        href={`/t/${thread_id}?c=${category}`}
                        skipDisc
                        className="capitalize py-1 px-2 rounded-full text-sm bg-gray10 border border-gray20 color-secondary"
                    >
                        {category}
                    </MetadataTile>


                    <MetadataTile skipDisc className="px-2 py-1 text-sm border color-secondary bg-purple-500/30 border-purple-500 rounded-md" condition={nsfw}>NSFW</MetadataTile>

                    <MetadataTile skipDisc className="px-2 py-1 text-sm border color-secondary bg-orange-500/30 border-orange-500 rounded-md" condition={spoiler}>Spoiler</MetadataTile>

                </MetadataTileContainer>

                <article>

                    <h1 className="selectable text-lg sm:text-xl font-semibold">{title}</h1>

                    <OptionalChildren condition={quoted_post_id && quoted_post_title}>
                        <section className="my-4 border border-gray30">
                            <Navigate comp="link" goto={`/p/${quoted_post_id}`} className="py-2">
                                <p className="mt-2 font-bold line-clamp-2">
                                    {quoted_post_title}
                                </p>
                                <div className="flex gap-2">
                                    <div className="text-sm ghostColor flex items-center gap-2">
                                        <QuoteIcon />
                                        <span>Quoted</span>
                                    </div>
                                    <div className="text-sm ghostColor">
                                        Frames: {quoted_post_frames_count}
                                    </div>
                                    <div className="text-sm ghostColor">
                                        Links: {quoted_post_links_count}
                                    </div>
                                </div>
                            </Navigate>
                        </section>
                    </OptionalChildren>

                    <p className="selectable mt-4 whitespace-break-spaces">{body}</p>

                </article>

                <OptionalChildren condition={frames?.length}>
                    <section className="my-2 w-full">
                        <FrameSlider id={_id} frames={frames} />
                    </section>
                </OptionalChildren>

                <LinksSection links={links} />
            </article>

            <section className="px-2 flex items-center gap-2">
                <ReactionButton uid={uid} id={_id} count={reaction_count} />

                <Button
                    id="post-comment-button"
                    title="Go To Comments"
                    onClick={handleFocus}
                    className="gap-2 text-sm items-center py-2 px-3 rounded-full border border-gray30"
                >
                    <span><CommentIcon /></span>
                    <span>{numberConverter(comment_count)}</span>
                </Button>


                <Navigate
                    comp="link"
                    title="Quote"
                    goto={`/new/post?qpid=${data._id}`}
                    className="flex gap-2 items-center py-2 px-3 text-sm rounded-full border border-gray30">
                    <QuoteIcon />
                    <span>Quote</span>
                </Navigate>

                <SaveButton
                    className="flex gap-2 items-center py-2 px-3 rounded-full border border-gray30"
                    author={user_id} uid={uid} type="Post" count={saved_count} id={_id} />
            </section>

        </>
    )
}

const PostHeader = (props: Props) => {

    return <GenericWrapper
        loadingComponent={<PostPageSkeleton />}
        component={Component}
        getQueryProps={getQueryProps}
        props={props}
    />
}

export default PostHeader;