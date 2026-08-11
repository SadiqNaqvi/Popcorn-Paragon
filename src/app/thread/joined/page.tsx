import { Navbar } from "@components";
import LoginModal from "@components/fallbacks/LoginModal";
import { getUserFromToken } from "@lib/backend/utils";
import { joinedThreadsOfUser } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import ThreadList from "../ThreadList";

export const metadata = generateDynamicMetadata({ title: "Joined Threads" });

const Page = async ({ searchParams }: ParloPageProps) => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return (
        <LoginModal skipFullScreen redirectTo="/thread/joined" />
    );

    const queryClient = getQueryClient();
    const { p } = await searchParams;
    const page = parseInt(p || "1") || 1;

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => joinedThreadsOfUser(user.user_id, page, jar),
        queryKey: getQueryKeys("joinedThreadsOfUser_uid", { uid: user.user_id }),
        initialPageParam: page,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Navbar navTitle="Joined Threads" />
            <ThreadList section="joined" />
        </HydrationBoundary>
    )
}

export default Page;