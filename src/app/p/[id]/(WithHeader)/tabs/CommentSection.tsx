"use client";

import CommentInput from "@components/CommentInput";
import InfiniteScroller from "@components/InfiniteScroller";
import { CommentBar, LoadingSpinner } from "@components/ui";
import { CommentSectionSkeleton } from "@components/ui/loading/CommentSkeleton";
import { getCommentsOnPost, getPostById } from "@lib/shared/helpers/internal_fetchers";
import { useQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import { FullPost } from "@type/internal";

type Props = {
    id: string,
    page: number,
    filter: string,
    allowNSFW: boolean,
}

const notFoundMessage = {
    title: "No comments yet",
    paras: ["Be the first to comment on this post"]
}

const CommentSection = ({ id, page, filter, allowNSFW }: Props) => {

    const { data, isFetching } = useQueryHook<FullPost>({
        queryFn: () => getPostById(id),
        queryKeys: getQueryKeys("post_id", { id }),
    });

    if (isFetching) return <CommentSectionSkeleton />
    else if (!data) return null;

    const { user_id } = data;

    return (
        <>
            <section className="pb-4 px-2 tablet:px-0">

                <InfiniteScroller
                    Component={CommentBar}
                    Loading={<CommentSectionSkeleton />}
                    fetchData={(p) => getCommentsOnPost(id, p, filter, allowNSFW)}
                    notFoundMessage={notFoundMessage}
                    queryKeys={getQueryKeys('commentsOfPost_pid_filter', { pid: id, filter })}
                    initialPage={page}
                    paginate={true}
                    className="min-h-[50dvh]"
                />

            </section>

            <CommentInput post_id={id} post_author={user_id} section="comments" />
        </>
    )
}

export default CommentSection;