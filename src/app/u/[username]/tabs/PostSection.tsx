"use client";

import { InfiniteScroller } from "@components";
import { PostBar } from "@components/ui";
import { PostListSkeleton } from "@components/ui/loading";
import { getPostsOfUser } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";

type Props = {
    username: string,
    uid: string,
    page: number,
    filter: string,
    allowNsfw: boolean
}

const PostSection = ({ username, uid, filter, page, allowNsfw }: Props) => {

    const { meta } = useCurrentUser();

    const notFoundMessage =
    {
        title: "Nothing to see here",
        paras: [
            meta && meta.user_id === uid ?
                "Maybe it's time for you to start posting" :
                `${username} haven't posted anything`
        ]
    };


    return (
        <InfiniteScroller
            Loading={<PostListSkeleton />}
            initialPage={page}
            queryKeys={getQueryKeys("postsOfUser_uid_filter", { uid, filter })}
            fetchData={(p) => getPostsOfUser(uid, p, allowNsfw, filter)}
            additional={{ section: "user" }}
            className="px-2 tablet:px-0"
            Component={PostBar}
            notFoundMessage={notFoundMessage}
        />
    )
}

export default PostSection;