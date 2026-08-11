import { PullToRefresh, Sidebar } from "@components";
import { OptionalChildren } from "@components/ui";
import { UserPageSkeleton } from "@components/ui/loading";
import { getUserFromToken } from "@lib/backend/utils";
import { checkUserConnection, getRoomByUserId, getUserByUsername } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient, prefetchQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { PropsWithChildren, Suspense } from "react";
import Header from "./Header";
import JsonLd from "@components/JsonLd";
import { generateJsonLdForUser } from "@lib/shared/seo/jsonld";
import generateDynamicMetadata from "@lib/shared/seo/metadata";

export const generateMetadata = async ({ params }: { params: Promise<{ username: string }> }) => {

    const { username } = await params;

    const { result, success } = await getUserByUsername(username);

    if (!success || !result) return generateDynamicMetadata({})

    const { bio, name } = result;

    return generateDynamicMetadata({
        title: username,
        description: `${bio ? bio.slice(0, 100) + ' - ' : `${name || username}'s profile on Parlocula. `}Explore shelves, posts, discussions, and activity across movies, shows, and communities.`,
        allowRobots: true,
    });
}

const Fetcher = async ({ username, children }: PropsWithChildren<{ username: string }>) => {
    const queryClient = getQueryClient();

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    const current = user?.username === username;

    const userKeys = getQueryKeys("user_username", { username });

    const rUser = await fetchQuery({
        queryKey: userKeys,
        queryFn: () => getUserByUsername(username),
        queryClient,
    });

    if (user && rUser && !current)
        await Promise.all([
            prefetchQuery({
                queryClient,
                queryKey: getQueryKeys("connection_ruid", { ruid: rUser._id }),
                queryFn: () => checkUserConnection(user.user_id, rUser._id, jar),
            }),
            prefetchQuery({
                queryClient,
                queryKey: getQueryKeys("roomExists_ruid_uid", { ruid: rUser._id, uid: user.user_id }),
                queryFn: () => getRoomByUserId(user.user_id, rUser._id, jar),
            }),
        ]);

    const jsonLd = rUser ? generateJsonLdForUser(rUser) : null;

    return (
        <>
            <JsonLd schemas={jsonLd} />

            <OptionalChildren condition={current}>
                <Sidebar />
            </OptionalChildren>

            <PullToRefresh>
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <Header uid={user?.user_id} username={username} />
                    {children}
                </HydrationBoundary>
            </PullToRefresh>
        </>
    )
}

const Layout = async ({ children, params }: PropsWithChildren<{ params: Promise<{ username: string }> }>) => {

    const { username } = await params;

    return (
        <Suspense fallback={<UserPageSkeleton heading={username} />}>
            <Fetcher username={username}>{children}</Fetcher>
        </Suspense>
    )
}

export default Layout;