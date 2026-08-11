"use client";

import { Navigate, BottomSheet } from "@components";
import NewRoomSheet from "@components/sheets/NewRoomSheet";
import { getRoomByUserId } from "@lib/shared/helpers/internal_fetchers";
import { useQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { Frame } from "@type/internal";

const MessageButton = ({ ruid, username, profile }: { ruid: string, username: string, profile: Frame | undefined }) => {

    const { meta } = useCurrentUser();

    const { data, isError, isPending } = useQueryHook<{ _id: string }>({
        queryKeys: meta ? getQueryKeys("roomExists_ruid_uid", { ruid, uid: meta.user_id }) : [],
        queryFn: () => getRoomByUserId((meta?.user_id as string), ruid),
        enabled: Boolean(meta && ruid !== meta.user_id),
    });

    if (isError || isPending || !meta || meta.user_id === ruid) return null;

    else if (data) return (
        <Navigate goto={`/room/${data._id}`}
            comp="link"
            className="btn secondary flex-1 sm:flex-none"
        >
            Message
        </Navigate>
    )

    return (
        <BottomSheet
            button="Message"
            buttonTitle="Message"
            className="btn secondary flex-1 sm:flex-none"
        >
            <NewRoomSheet ruser={{ _id: ruid, username, profile }} />
        </BottomSheet>
    )
}

export default MessageButton;