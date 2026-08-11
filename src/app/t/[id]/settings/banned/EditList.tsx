
import { CheckIcon } from "@assets/Icons";
import { ListSelector, ListSelectorRef, Navbar } from "@components";
import { Button } from "@components/ui";
import { blockOrBanLimit } from "@lib/shared/constants";
import { searchBannedMembers, searchMembers } from "@lib/shared/helpers/internal_fetchers";
import { banMembersMutation, unbanMembersMutation } from "@lib/frontend/helpers/mutations";
import { getQueryKeys } from "@lib/shared/utils";
import { MereUser } from "@type/internal";
import { TypedFunction } from "@type/other";
import { useRef } from "react";

export const UnbanAction = ({ tid, uid }: { tid: string, uid: string, back: TypedFunction }) => {

    const callbackRef = useRef<ListSelectorRef>(null);

    const handleUnBan = () => {
        const users = callbackRef.current?.();
        if (!users || !users.length) return;
        unbanMembersMutation(tid, uid, { users });
    }

    return (
        <>
            <Navbar
                navTitle="Select to Unban"
                OptionButton={
                    <Button
                        id="submit-unban-button"
                        title="Unban"
                        onClick={handleUnBan}
                    >
                        <CheckIcon />
                    </Button>
                }
            />
            <ListSelector
                mode="search"
                callbackRef={callbackRef}
                limit={blockOrBanLimit}
                queryFn={(q, p) => searchBannedMembers(tid, uid, q, p)}
                queryKeys={(query) => getQueryKeys("searchBannedMembers_tid_query", { tid, query })}
                refiner={(user) => ({
                    id: user._id,
                    title: user.username,
                    poster: user.profile,
                })}
                inputPlaceholder="Search banned users to unban"
            />
        </>
    )

}

export const BanAction = ({ tid, uid }: { tid: string, uid: string, back: TypedFunction }) => {

    const callbackRef = useRef<ListSelectorRef<MereUser>>(null);

    const handleBan = () => {
        const users = callbackRef.current?.();
        if (!users || !users.length) return;
        banMembersMutation(tid, uid, users);
    }

    return (
        <>
            <Navbar navTitle="Select to Ban"
                OptionButton={
                    <Button
                        id="submit-ban-button"
                        title="Ban"
                        onClick={handleBan}
                    >
                        <CheckIcon />
                    </Button>
                }
            />
            <ListSelector
                mode="search"
                callbackRef={callbackRef}
                limit={blockOrBanLimit}
                queryFn={(q, p) => searchMembers(tid, q, p)}
                queryKeys={(query) => getQueryKeys("searchMembers_tid_query", { tid, query })}
                refiner={(user) => ({
                    id: user._id,
                    title: user.username,
                    poster: user.profile,
                    returnVal: user
                })}
                inputPlaceholder="Search members to ban"
            />
        </>
    )

}