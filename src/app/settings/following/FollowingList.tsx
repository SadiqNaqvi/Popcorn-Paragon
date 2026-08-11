"use client";

import { Navbar, SearchInList } from "@components";
import { UserBar } from "@components/ui";
import { getFollowing, searchFollowing } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";

const FollowingList = () => {
    const { meta } = useCurrentUser();

    if (!meta) return null;

    const uid = meta.user_id;

    return (
        <>
            <Navbar navTitle="Followings" />

            <SearchInList
                Component={UserBar}
                queryFn={(q, p) => searchFollowing(q, uid, p)}
                queryFnForList={(p) => getFollowing(uid, p)}
                queryKeys={(query) => getQueryKeys("search-following_uid_query", { query, uid })}
                queryKeysForList={getQueryKeys("followingOfCurrentUser_uid", { uid })}
                inputPlaceholder="Search Followings"
            />
        </>
    )
}

export default FollowingList;