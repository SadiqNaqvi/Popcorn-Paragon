import { Navbar, SearchInList } from "@components";
import { UserBar } from "@components/ui";
import { getBlockedUsers, searchBlockedUsers } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";

const BlockedList = () => {
    const { meta } = useCurrentUser();

    if (!meta) return null;

    const uid = meta.user_id;

    return (
        <>
            <Navbar navTitle="Blocked Users" />
            <SearchInList
                Component={UserBar}
                queryFn={(q, p) => searchBlockedUsers(q, uid, p)}
                queryFnForList={(p) => getBlockedUsers(uid, p)}
                queryKeys={(query) => ["search", "blockedUsers", query]}
                queryKeysForList={getQueryKeys("blockedByCurrentUser_uid", { uid })}
                inputPlaceholder="Search Blocked Users"
            />
        </>
    )

}

export default BlockedList;