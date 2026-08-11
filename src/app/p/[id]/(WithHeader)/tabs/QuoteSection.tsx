"use client";

import { InfiniteScroller } from "@components";
import { PostBar } from "@components/ui";
import { PostListSkeleton } from "@components/ui/loading";
import { getQuotesOfPost } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";

const QuoteSection = ({ id, page, allowNsfw }: { id: string, page: number, allowNsfw: boolean }) => {

    const nFM = {
        title: "No Quotes of this post",
        paras: ["Be the first to quote this post."]
    }

    return (
        <InfiniteScroller
            Component={PostBar}
            Loading={<PostListSkeleton />}
            fetchData={(p) => getQuotesOfPost(id, p, allowNsfw)}
            queryKeys={getQueryKeys("quotes_pid", { pid: id })}
            initialPage={page}
            notFoundMessage={nFM}
        />
    )

}

export default QuoteSection;