"use client"

import { FrameIcon, LinkIcon, PostIcon, VisitIcon } from "@assets/Icons";
import { BottomSheet, GenericWrapper, Navigate, ObserverHeader } from "@components";
import { ContentFiltered } from "@components/fallbacks";
import { OptionalChildren, ParloImage } from "@components/ui";
import { ThreadPageSkeleton } from "@components/ui/loading";
import { TabContainer, TabList } from "@components/ui/Tabs";
import { getThreadById } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import { Thread as ThreadType } from "@type/internal";
import { PropsWithChildren } from "react";
import { ActionsButton, EllipsisButton, ThreadDetailsSheet } from "./";

type Props = {
    id: string,
    uid?: string
    filterContent: boolean;
}

const getQueryProps = ({ id }: Props) => ({
    queryKeys: getQueryKeys("thread_id", { id }),
    queryFn: getThreadById,
    args: [id],
});

const Component = (data: ThreadType, { id, uid, children, filterContent }: PropsWithChildren<Props>) => {

    const { _id, connections, creator, createdAt, created_by, description, links, member_count, nsfw, edited_by, poster, post_count, name, managers } = data;

    return (
        <>
            <OptionalChildren condition={nsfw}>
                <ContentFiltered filterContent={filterContent} allow={uid === created_by} redirectPath={`/t/${_id}`} />
            </OptionalChildren>
            <ObserverHeader
                navTitle={name}
                titleToShare={`Check out a thread on "${name}" on Parlocula`}
                OptionButton={<EllipsisButton creator={created_by} tid={_id} />}
                className="px-2 sm:px-4 mt-2">

                <section className="flex gap-2 sm:gap-4 items-center">
                    <ParloImage
                        className="min-w-24 size-24 sm:min-w-32 sm:size-32 object-cover"
                        containerClassName="rounded-full overflow-hidden"
                        classNameForFallback="max-w-fit min-w-16 size-16 sm:min-w-24 sm:size-24 p-4"
                        frame={poster}
                        sizes={[
                            { imageWidth: 96, maxScreenWidth: 480 },
                            { imageWidth: 128 },
                        ]}
                        frameType="groupPoster"
                        fancyGallery="thread-poster"
                        fileNameToDownload={`Poster of thread "${name}" - Parlocula`}
                        size={128}
                        alt={`Poster of the thread - ${name}`}
                        prioritize
                    />

                    <div className="space-y-1">
                        <h1 data-observe className="selectable text-lg sm:text-xl md:text-2xl line-clamp-2 capitalize font-semibold">{name}</h1>
                        <h2 className="text-sm space-x-1">
                            <span>Created by</span>
                            <Navigate className="inline underline" comp="link" goto={`/u/${creator}`}>@{creator}</Navigate>
                        </h2>
                    </div>

                </section>
                <section className="mt-4">

                    <OptionalChildren condition={nsfw}>
                        <div className="my-4">
                            <span className="py-1 px-2 rounded-md border border-purple-500 bg-purple-500/30">NSFW</span>
                        </div>
                    </OptionalChildren>

                    <BottomSheet
                        className="text-sm line-clamp-2 whitespace-break-spaces text-left customStyling cursor-pointer"
                        button={description}
                        buttonTitle="View Description"
                    >
                        <ThreadDetailsSheet
                            _id={_id}
                            connections={connections}
                            createdAt={createdAt}
                            creator={creator}
                            description={description}
                            edited_by={edited_by}
                            links={links}
                            managers={managers}
                            member_count={member_count}
                            post_count={post_count}
                        />
                    </BottomSheet>

                    <OptionalChildren condition={connections.length}>
                        <div className="mt-4 sapce-y-2">
                            <h2 className="parloHeading">Connected to:</h2>
                            <ul className="flex gap-2 overflow-x-auto noScroll">
                                {connections.map(({ name, extid, type }) => (
                                    <li key={extid} className="border border-gray20 bg-gray10 rounded-md whitespace-nowrap">
                                        <Navigate
                                            className="p-2 flex gap-2 flex-cntr-between"
                                            comp="link"
                                            goto={`/explore/${type === "person" ? "artist" : type}/${extid}`}
                                        >
                                            <VisitIcon className="size-4" />
                                            <span className="line-clamp-1">{name}</span>
                                        </Navigate>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </OptionalChildren>
                </section>

                <section className="mt-4">
                    <ActionsButton uid={uid} thread={{ _id, name, poster }} />
                </section>

            </ObserverHeader>

            <TabContainer className="my-4">
                <TabList className="flex gap-2 flex-cntr-all" href={`/t/${id}`}>
                    <PostIcon className="min-w-5" />
                    <span>Posts</span>
                </TabList>
                <TabList className="flex gap-2 flex-cntr-all" href={`/t/${id}/frames`}>
                    <FrameIcon className="min-w-5" />
                    <span>Frames</span>
                </TabList>
                <TabList className="flex gap-2 flex-cntr-all" href={`/t/${id}/links`}>
                    <LinkIcon className="min-w-5" />
                    <span>Links</span>
                </TabList>
            </TabContainer>

            {children}
        </>
    )

}

const Thread = (props: PropsWithChildren<Props>) => (
    <GenericWrapper
        loadingComponent={<ThreadPageSkeleton />}
        component={Component}
        getQueryProps={getQueryProps}
        props={props}
    />
);

export default Thread;