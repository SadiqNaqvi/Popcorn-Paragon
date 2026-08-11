"use client";

import { Navbar, SearchInList } from "@components";
import { UserBar } from "@components/ui";
import { getFollowers, searchFollowers } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";

const FollowerList = () => {
    const { meta } = useCurrentUser();

    if (!meta) return null;

    const uid = meta.user_id;

    return (
        <>
            <Navbar navTitle="Followers" />
            <SearchInList
                Component={UserBar}
                queryFn={(q, p) => searchFollowers(q, uid, p)}
                queryFnForList={(p) => getFollowers(uid, p)}
                queryKeys={(query) => getQueryKeys("search-followers_uid_query", { query, uid })}
                queryKeysForList={getQueryKeys("followersOfCurrentUser_uid", { uid })}
                inputPlaceholder="Search Followers"
            />
        </>
    )

}

export default FollowerList;