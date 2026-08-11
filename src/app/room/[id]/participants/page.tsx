import { getUserFromToken } from "@lib/backend/utils";
import { getParticipantsOfRoom, getRoomById } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ParticipantsPage from "./ParticipantsPage";

const RoomMembersPage = async ({ params }: ParloPageProps) => {

    const { id } = await params;

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return null;

    const uid = user.user_id;
    const [rmid] = id.split('-');

    const queryClient = getQueryClient();

    const [room] = await Promise.all([
        fetchQuery({
            queryClient,
            queryFn: () => getRoomById(uid, rmid, jar),
            queryKey: getQueryKeys("room_rmid_uid", { rmid, uid })
        }),
        prefetchInfiniteQuery({
            queryClient,
            queryFn: () => getParticipantsOfRoom(uid, rmid, 1, jar),
            queryKey: getQueryKeys("participantsOfRoom_rmid_uid", { rmid, uid })
        })
    ]);

    if (!room) return null;
    else if (room.type === "private")
        redirect("/room");

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ParticipantsPage participantType={room.participantType} rmid={rmid} uid={uid} />
        </HydrationBoundary>
    )
}

export default RoomMembersPage;