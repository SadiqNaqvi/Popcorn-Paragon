import { NotFound } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils";
import { getMessages, getRoomById } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery, prefetchQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import DefaultSection from "../DefaultSection";
import ChatSection from "./ChatSection";

const RoomSection = async ({ params }: ParloPageProps) => {

    const { id } = await params;

    const queryClient = getQueryClient();
    const [rmid] = id.split('-');
    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return null;

    else if (rmid === "search" || rmid === "create" || rmid === "invitations") return (
        <DefaultSection />
    );

    else if (!rmid) return (
        <NotFound
            title="Oops! Looks like the Popcorn Explorers couldn't find anything"
            paras={["Please search the user in the explore page."]}
            fullScreen
        />
    )

    await Promise.all([
        prefetchQuery({
            queryClient,
            queryFn: () => getRoomById(user.user_id, rmid, jar),
            queryKey: getQueryKeys("room_rmid_uid", { rmid, uid: user.user_id }),
        }),
        prefetchInfiniteQuery({
            queryClient,
            queryFn: () => getMessages(user.user_id, rmid, 1, jar),
            queryKey: getQueryKeys("messages_rmid", { rmid }),
        }),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <section className="flex-1 h-stretch">
                <ChatSection rmid={rmid} uid={user.user_id} />
            </section>
        </HydrationBoundary>
    );
}

export default RoomSection;