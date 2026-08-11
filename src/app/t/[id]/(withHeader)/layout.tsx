import { NotFound } from "@components/fallbacks";
import JsonLd from "@components/JsonLd";
import { ThreadPageSkeleton } from "@components/ui/loading";
import { getUserFromToken } from "@lib/backend/utils";
import { getThreadById, isMember } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient, prefetchQuery } from "@lib/backend/providers/queryClient";
import { generateJsonLdForThread } from "@lib/shared/seo/jsonld";
import { createArray, getQueryKeys, isValidParloId } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { PropsWithChildren, Suspense } from "react";
import Thread from "./Thread";
import generateDynamicMetadata from "@lib/shared/seo/metadata";

export const generateMetadata = async ({ params }: ParloPageProps): Promise<Metadata> => {
    const thread_id = (await params).id.split('-')[0];

    const fallbackMetadata = generateDynamicMetadata({});

    if (!isValidParloId(thread_id))
        return fallbackMetadata;

    const { success, result } = await getThreadById(thread_id);

    if (!success || !result) return fallbackMetadata;

    const { name, description } = result;
    return generateDynamicMetadata({
        title: `${name} - Thread`,
        description: `${description.slice(0, 100)} - Join discussions, share posts, discover shelves, and connect with other fans.`,
        allowRobots: true,
    });
}

const Fetcher = async ({ tid, children }: PropsWithChildren<{ tid: string }>) => {
    const queryClient = getQueryClient();

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    const [thread] = await Promise.all(
        createArray<any>(
            fetchQuery({
                queryClient,
                queryKey: getQueryKeys("thread_id", { id: tid }),
                queryFn: () => getThreadById(tid),
            }),
        ).concatConditionally(user?.user_id, (uid) => [
            prefetchQuery({
                queryClient,
                queryKey: getQueryKeys("membership_tid", { tid }),
                queryFn: () => isMember(tid, uid, jar),
            }),

        ])
    )

    const jsonLd = thread ? generateJsonLdForThread(thread) : null;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>

            <JsonLd schemas={jsonLd} />

            <Thread
                filterContent={user?.filterContent ?? true}
                uid={user?.user_id}
                id={tid}>
                {children}
            </Thread>

        </HydrationBoundary>
    )
}

const ThreadLayout = async ({ children, params }: PropsWithChildren<ParloPageProps>) => {

    const { id } = await params;
    const [tid, ...rest] = id.split('-');

    if (!isValidParloId(tid)) return (
        <NotFound
            title="Oops! Look's like you came across a wrong path."
            paras={["Thread id is incorrect", "Please search the thread in explore page."]}
        />
    );

    return (
        <Suspense fallback={<ThreadPageSkeleton heading={rest?.join(' ')} />}>
            <Fetcher tid={tid}>{children}</Fetcher>
        </Suspense>
    )

}

export default ThreadLayout;