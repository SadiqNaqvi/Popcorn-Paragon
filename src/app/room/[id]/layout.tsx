import LoginModal from "@components/fallbacks/LoginModal";
import { NotFound } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils";
import { getRoomById } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import { PropsWithChildren } from "react";
import DefaultSection from "../DefaultSection";

const ChatLayout = async ({ params, children }: PropsWithChildren<ParloPageProps>) => {
    const { id } = await params;

    const [rmid] = id.split('-');

    const queryClient = getQueryClient();
    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return (
        <LoginModal redirectTo="/room" />
    )

    else if (rmid === "search" || rmid === "create" || rmid === "invitations") return (
        <DefaultSection />
    );

    const room = await fetchQuery({
        queryClient,
        queryFn: () => getRoomById(user.user_id, rmid, jar),
        queryKey: getQueryKeys("room_rmid_uid", { rmid, uid: user.user_id }),
    });

    if (!room) return (
        <NotFound
            title="Oops! Looks like The Parlocula Explorers couldn't find anything."
            paras={["Possible Reason: Incorrect room id.", "Please visit inbox and try again."]}
        />
    )

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {children}
        </HydrationBoundary>
    )

}

export default ChatLayout;