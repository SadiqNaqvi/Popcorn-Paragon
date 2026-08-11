"use client";

import InfiniteScroller from "@components/InfiniteScroller";
import { FrameTile, PostBar } from "@components/ui";
import { OnlyFrameSkeletonList, PostListSkeleton } from "@components/ui/loading";
import { getPostsOfThread } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";

type PostSectionProps = {
    id: string,
    page?: number,
    filter: string,
    category?: string,
    section: "posts" | "frames" | "links",
    allowNsfw: boolean,
}

const Component = ({ section, props }: { section: string, props: any }) => {
    if (section === "frames") return <FrameTile {...props} />;
    else return <PostBar {...props} />;
}

const LoadingComponent = ({ section }: { section: string }) => {
    if (section === "frames") return <OnlyFrameSkeletonList />;
    else return <PostListSkeleton />;
}

const PostsSection = ({ id, page = 1, filter, category, section, allowNsfw }: PostSectionProps) => {

    const notFoundMessages = {
        title: section === "frames" || section === "links"
            ? `No posts found with ${section}.`
            : "Such an empty thread!",
        paras: ["Be the first to post in this thread"]
    }

    return (
        <section className="px-2">
            <InfiniteScroller
                Loading={<LoadingComponent section={section} />}
                initialPage={page}
                className={section === "frames" ? "grid grid-cols-3 sm:grid-cols-4 gap-2" : undefined}
                notFoundMessage={notFoundMessages}
                additional={{ section: "thread" }}
                Component={(props) => <Component section={section} props={props} />}
                fetchData={(p) => getPostsOfThread(id, p, allowNsfw, filter, section, category)}
                queryKeys={getQueryKeys('postsOfThread_tid_filter_category', { tid: id, filter, category: category ?? "none" })}
            />
        </section>
    )
}

export default PostsSection;