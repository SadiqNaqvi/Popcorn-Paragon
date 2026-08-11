"use client";

import { NotFound, ShowError } from "@components/fallbacks";
import { HomeNavbar } from "@components/TopNavbar";
import { Button, OptionalChildren, PostBar, VerticleMovieCard } from "@components/ui";
import { HomePageSkeleton } from "@components/ui/loading";
import LoadingSpinner from "@components/ui/loading/LoadingSpinner";
import { updateFeedViewed } from "@lib/frontend/helpers/mutations";
import { FeedPost, useFeedHook } from "@lib/frontend/hooks";
import useCurrentUser from "@store/user";
import { ErrorCodes } from "@type/other";
import { useEffect, useRef } from "react";

const FeedCard = ({ post, setViewed }: { post: FeedPost, setViewed: (post: string) => void }) => {

    const postListContainer = useRef<HTMLLIElement>(null);
    const isVisibleRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {

        const { current } = postListContainer;

        if (!current) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {

                isVisibleRef.current = true;

                timeoutRef.current = setTimeout(() => {
                    if (isVisibleRef.current) {
                        setViewed(post._id);
                    }
                }, 2000);

            } else {
                isVisibleRef.current = true;
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
            }
        }, { threshold: 0.8 });

        observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        }

    }, []);


    if ("isSlide" in post) return (
        <li className="list-style-none border-b border-gray10 last:border-0">
            <article className="px-2 py-4 w-full space-y-2">
                <h3 className="font-semibold text-sm uppercase mb-2">{post.title}</h3>
                <ul className="flex w-full overflow-x-auto noScroll gap-2">
                    {post.data.map(content => (
                        <li key={content.id} className="contents">
                            <VerticleMovieCard {...content} />
                        </li>
                    ))}
                </ul>
            </article>
        </li>
    )

    return (
        <li ref={postListContainer} className="list-style-none group px-2">
            <PostBar {...post} />
        </li>
    )

}

const FeedPage = ({ allowNsfw }: { allowNsfw: boolean }) => {

    const { data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useFeedHook(allowNsfw);
    const viewedMap = useRef(new Map<string, true>());
    const loadingContainerRef = useRef<HTMLDivElement>(null);
    const { dataSaver, meta } = useCurrentUser();

    useEffect(() => {
        if (dataSaver) return;

        const current = loadingContainerRef.current;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isFetchingNextPage && hasNextPage)
                fetchNextPage();
        }, { threshold: 0.1 });

        if (current && hasNextPage) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        }
    }, [dataSaver, isFetchingNextPage, fetchNextPage, hasNextPage]);

    useEffect(() => {
        return () => {
            const current = viewedMap.current

            if (current.size && meta) {
                const posts = Array.from(current.keys());
                updateFeedViewed(meta.user_id, posts);
            }
        }
    }, []);

    if (isLoading)
        return <HomePageSkeleton />

    else if (error) return (
        <>
            <HomeNavbar />
            <ShowError
                heading="Oops! Error occured"
                errCode={error.message as ErrorCodes}
                retry={refetch}
            />
        </>
    )

    else if (!data || !data.pages.length || data.pages[0].total_results === 0) return (
        <>
            <HomeNavbar />
            <NotFound
                title="Such an empty feed"
                paras={["Guess its time to start joining threads, following users and start posting"]}
            />
        </>
    )

    const manuallyLoadNextPage = () => {
        fetchNextPage();
    }

    const setViewed = (pid: string) => {
        viewedMap.current.set(pid, true);
    }

    return (
        <>
            <HomeNavbar />
            <div id="feedContainer">
                <ul>
                    {data.pages.
                        flatMap(page => page.results)
                        .map((post) => (
                            <FeedCard post={post} setViewed={setViewed} key={post._id} />
                        ))}
                </ul>
                <OptionalChildren condition={hasNextPage}>
                    <OptionalChildren condition={dataSaver || isFetchingNextPage}>
                        <div ref={loadingContainerRef} className="mt-4 py-2">
                            <LoadingSpinner />
                        </div>
                    </OptionalChildren>
                    <OptionalChildren condition={!(dataSaver || isFetchingNextPage)}>
                        <div className="w-full flex flex-cntr-all">
                            <Button
                                id="feed-load-more-button"
                                title="Load More"
                                className="primary"
                                onClick={manuallyLoadNextPage}
                            >
                                Load More
                            </Button>
                        </div>
                    </OptionalChildren>
                </OptionalChildren>
            </div>
        </>
    )
}

export default FeedPage;