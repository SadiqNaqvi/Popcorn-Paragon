"use client";

import { GenericWrapper, Navbar, Navigate, SaveButton } from "@components";
import { BreadCrumbs, BreadCrumbTile, MetadataTile, MetadataTileContainer, OptionalChildren, ParloImage, TabContainer, TabList } from "@components/ui";
import { getCommentById } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys, timeAgo } from "@lib/shared/utils";
import { FullComment } from "@type/internal";
import Image from "next/image";
import OptionsButton from "./Ellipsis";
import LikeButton from "./LikeButton";
import { ContentFiltered } from "@components/fallbacks";
import CommentPageSkeleton from "@components/ui/loading/CommentPageSkeleton";
import { AlertIcon, CommentIcon } from "@assets/Icons";

type Props = {
    id: string,
    uid: string | undefined,
    filterContent: boolean,
}

const getQueryProps = ({ id }: Props) => ({
    queryKeys: getQueryKeys("comment_cid", { cid: id }),
    args: [id],
    queryFn: getCommentById
});

const Component = (data: FullComment, { uid, id, filterContent }: Props) => {

    const {
        _id, thread_id, parentComment, saved_count, attachment, content, createdAt, user_id, post_id, replied_to, edited_at, likes_count, profile, username, post_author, nsfw, spoiler
    } = data;

    return (
        <>

            <ContentFiltered filterContent={filterContent} allow={user_id === uid} redirectPath={`/c/${_id}`} />

            <Navbar
                titleToShare={`Read the comment by ${username} and their replies on Parlocula`}
                className="sticky bg-primary -mt-4 mb-4"
                OptionButton={
                    <OptionsButton comment={data} author={user_id} id={_id} />
                }
            />

            <article className="space-y-4 px-2">

                <header className="flex items-center gap-3">

                    <ParloImage
                        className="min-w-10 size-10 object-cover"
                        containerClassName="rounded-full overflow-hidden"
                        classNameForFallback="size-6"
                        frame={profile}
                        frameType="userProfile"
                        size={24}
                        alt={`Profile picture of the author of comment - ${username}`}
                    />

                    <BreadCrumbs>
                        <BreadCrumbTile href={thread_id}>Thread</BreadCrumbTile>
                        <BreadCrumbTile href={post_id}>Post</BreadCrumbTile>
                        <OptionalChildren condition={parentComment && replied_to}>
                            <BreadCrumbTile href={replied_to}>Parent Comment</BreadCrumbTile>
                        </OptionalChildren>
                        <BreadCrumbTile
                            className={username ? undefined : "text-gray-500"}
                            href={username ? `/u/${username}` : undefined}>{username || "*Deleted User*"}</BreadCrumbTile>
                    </BreadCrumbs>

                </header>

                <MetadataTileContainer>
                    <MetadataTile>{timeAgo(createdAt)}</MetadataTile>
                    <MetadataTile className="px-2 py-1 bg-gray10 border-gray20 rounded-md" condition={!!edited_at}>Edited: {timeAgo(edited_at)}</MetadataTile>
                    <MetadataTile className="px-2 py-1 bg-gray10 border-purple-500 text-purple-500 rounded-md" condition={nsfw}>NSFW</MetadataTile>
                    <MetadataTile className="px-2 py-1 bg-gray10 border-orange-500 text-orange-500 rounded-md" condition={spoiler}>Spoiler</MetadataTile>
                </MetadataTileContainer>

                <section className="flex gap-4 flex-col">

                    <OptionalChildren condition={!!content.length}>
                        <p>{content}</p>
                    </OptionalChildren>

                    <OptionalChildren condition={attachment}>
                        <Image
                            height={250}
                            width={250}
                            src={attachment}
                            alt="Attachment GIF with the post"
                            unoptimized
                            className="size-64 rounded-md border border-gray30 object-contain"
                        />
                    </OptionalChildren>
                </section>

            </article>

            <div className="flex gap-2 my-4 items-center px-2">

                <LikeButton uid={uid} author={post_author} id={_id} likesCount={likes_count} />

                <SaveButton
                    className="flex gap-2 items-center py-2 px-3 rounded-full border border-gray30"
                    author={user_id} uid={uid} count={saved_count} id={_id} type="Comment" />

            </div>
            <OptionalChildren condition={uid}>
                <TabContainer>
                    <TabList className="flex gap-2 flex-cntr-all" href={`/c/${id}`}>
                        <CommentIcon className="min-w-5" />
                        <span>Replies</span>
                    </TabList>
                    <TabList className="flex gap-2 flex-cntr-all" href={`/c/${id}/reports`}>
                        <AlertIcon className="min-w-5" />
                        <span>Reports</span>
                    </TabList>
                </TabContainer>
            </OptionalChildren>
        </>
    );
}

const CommentHeader = (props: Props) => {
    return (
        <GenericWrapper
            loadingComponent={<CommentPageSkeleton />}
            component={Component}
            getQueryProps={getQueryProps}
            props={props}
        />
    )
}

export default CommentHeader;