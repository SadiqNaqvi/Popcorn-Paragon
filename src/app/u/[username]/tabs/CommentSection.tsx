"use client";

import { InfiniteScroller } from "@components";
import { CommentBarWithoutReply } from "@components/ui";
import { CommentSectionSkeleton } from "@components/ui/loading";
import { getCommentsOfUser } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";

type Props = {
    uid: string,
    page: number,
    filter: string,
    allowNsfw: boolean
}

const CommentSection = ({ filter, page, uid, allowNsfw }: Props) => {

    const { meta } = useCurrentUser();

    const notFoundMessage = meta?.user_id === uid ?
        {
            title: "Create your first comment",
            paras: ["Open a post and start commenting."]
        } : {
            title: "Nothing to see here",
            paras: ["The user has not made any comments yet"]
        };

    return (
        <InfiniteScroller
            Loading={<CommentSectionSkeleton />}
            initialPage={page}
            queryKeys={getQueryKeys("commentsOfUser_uid_filter", { uid, filter })}
            fetchData={(p) => getCommentsOfUser(uid, p, allowNsfw, filter)}
            className="px-2 tablet:px-0"
            Component={CommentBarWithoutReply}
            notFoundMessage={notFoundMessage}
        />
    )
}

export default CommentSection