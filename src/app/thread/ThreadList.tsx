"use client";

import { InfiniteScroller } from "@components";
import { ThreadTile } from "@components/ui";
import ThreadBarSkeleton, { ThreadListSkeleton } from "@components/ui/loading/ThreadBarSkeleton";
import { createdThreadsOfUser, getThreads, joinedThreadsOfUser, threadsManageByUser } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import useOfflineStore from "@store/offlineStore";
import useCurrentUser from "@store/user";
import { InfiniteQueryResponse } from "@type/internal";

type PopularSectionProps = {
    page: number,
    filter: string,
    allowNsfw: boolean,
}

type Props =
    ({ section: "popular" } & PopularSectionProps)
    | { section: "joined" | "created" | "manages" };


const ManageThreadsList = ({ uid }: { uid: string }) => {
    return (
        <InfiniteScroller
            Loading={<ThreadListSkeleton />}
            Component={ThreadTile}
            fetchData={(p) => threadsManageByUser(uid, p)}
            queryKeys={getQueryKeys("threadsManageByUser_uid", { uid })}
        />
    )
}

const CreatedThreadsList = ({ uid }: { uid: string }) => {
    return (
        <InfiniteScroller
            Loading={<ThreadListSkeleton />}
            Component={ThreadTile}
            fetchData={(p) => createdThreadsOfUser(uid, p)}
            queryKeys={getQueryKeys("createdThreadsOfUser_uid", { uid })}
        />
    )
}

const JoinedThreadsList = ({ uid }: { uid: string }) => {
    const [threadList, setThreadList] = useOfflineStore<InfiniteQueryResponse | undefined>("joined-threads", undefined);
    return (
        <InfiniteScroller
            Loading={<ThreadListSkeleton />}
            Component={ThreadTile}
            fetchData={(p) => joinedThreadsOfUser(uid, p)}
            queryKeys={getQueryKeys("joinedThreadsOfUser_uid", { uid })}
            onSuccess={(d) => {
                if (d.pages[0]?.page === 1)
                    setThreadList(d.pages[0])
            }}
            placeholderData={threadList}
        />
    )
}

const PopularThreadsList = ({ filter, page, allowNsfw }: PopularSectionProps) => (
    <InfiniteScroller
        Loading={<ThreadListSkeleton />}
        initialPage={page}
        Component={ThreadTile}
        fetchData={(p) => getThreads(p, allowNsfw, filter)}
        queryKeys={getQueryKeys("threads_filter", { filter })}
        notFoundMessage={{ title: "Not even a single thread?", paras: ["Be the first one to create a thread."] }}
    />
)

const ThreadList = (props: Props) => {
    const { section } = props;
    const { meta } = useCurrentUser();

    if (section === "popular") return (
        <PopularThreadsList allowNsfw={props.allowNsfw} filter={props.filter} page={props.page} />
    )

    else if (!meta) return null;

    const uid = meta.user_id;

    if (section === "created") return <CreatedThreadsList uid={uid} />

    else if (section === "joined") return <JoinedThreadsList uid={uid} />

    else if (section === "manages") return <ManageThreadsList uid={uid} />

}

export default ThreadList;