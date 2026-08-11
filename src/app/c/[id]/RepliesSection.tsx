"use client";

import { InfiniteScroller } from "@components";
import CommentInput from "@components/CommentInput";
import { CommentSectionSkeleton } from "@components/ui/loading";
import { CommentBar } from "@components/ui";
import { getCommentById, getRepliesOnComment } from "@lib/shared/helpers/internal_fetchers";
import { useQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import { FullComment } from "@type/internal";
import useCurrentUser from "@store/user";

type Props = {
    cid: string,
    filter: string,
    page: number,
}

const RepliesSection = ({ cid, filter, page }: Props) => {

    const qkeys = getQueryKeys("replies_cid_filter", { cid, filter });

    const { dataSaver, isHydrated, filterContent } = useCurrentUser();

    const { data } = useQueryHook<FullComment>({
        queryFn: () => getCommentById(cid),
        queryKeys: getQueryKeys("comment_cid", { cid })
    });

    if (!data) return null;

    return (
        <>
            <InfiniteScroller
                Component={CommentBar}
                fetchData={(p) => getRepliesOnComment(cid, p, filter, !filterContent)}
                queryKeys={qkeys}
                initialPage={page}
                Loading={<CommentSectionSkeleton />}
                enabled={Boolean(isHydrated && !dataSaver)}
            />

            <CommentInput
                post_author={data.post_author}
                post_id={data.post_id}
                section="replies"
            />
        </>
    )
}

export default RepliesSection;