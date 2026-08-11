"use client";

import { Navbar, SearchInList } from "@components";
import { FullPageUserBarSkeleton } from "@components/ui/loading";
import UserBar from "@components/ui/UserBar";
import { getMembers, searchMembers } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";

const notFoundMessage = {
    title: "Oops! Looks like you entered an vacant thread.",
    paras: ["Join this thread to see your name here."]
}

const MembersList = ({ tid }: { tid: string }) => (
    <>
        <Navbar navTitle="Members" />
        <section className="mt-4">
            <SearchInList
                Component={UserBar}
                Loading={<FullPageUserBarSkeleton />}
                queryKeysForList={getQueryKeys("members_tid", { tid })}
                queryFnForList={(p) => getMembers(tid, p)}
                queryFn={(q, p) => searchMembers(tid, q, p)}
                queryKeys={(query) => getQueryKeys("searchMembers_tid_query", { tid, query })}
                notFoundMessage={notFoundMessage}
            />
        </section>
    </>
)

export default MembersList;