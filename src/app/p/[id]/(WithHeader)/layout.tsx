import { AlertIcon, CommentIcon, QuoteIcon } from "@assets/Icons";
import { NotFound, ShowError } from "@components/fallbacks";
import JsonLd from "@components/JsonLd";
import { OptionalChildren, TabContainer, TabList } from "@components/ui";
import PostPageSkeleton from "@components/ui/loading/PostPageSkeleton";
import { getUserFromToken } from "@lib/backend/utils";
import { checkIfItemSaved, getPostById, getReactionOnPost } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient, prefetchQuery } from "@lib/backend/providers/queryClient";
import { generateJsonLdForPost } from "@lib/shared/seo/jsonld";
import { calculateAge, getQueryKeys, isValidParloId } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { PropsWithChildren, Suspense } from "react";
import PostHeader from "./PostHeader";
import generateDynamicMetadata from "@lib/shared/seo/metadata";

export const generateMetadata = async ({ params }: ParloPageProps): Promise<Metadata> => {

    const id = (await params).id.split('-')[0];

    const fallbackMetadata = generateDynamicMetadata({});

    if (!isValidParloId(id)) return fallbackMetadata;

    const { result, success } = await getPostById(id);

    if (!success || !result) return fallbackMetadata;

    const { title, username, body, thread_name } = result;

    const description = body.replace(/[#>*`]/g, "")
        .slice(0, 150)

    return generateDynamicMetadata({
        title: `${title.slice(0, 80)}${title.length > 80 ? "..." : ''}${username ? " - Post by @" + username : ""}`,
        description: `${description} - Discussion posted in ${thread_name} on Parlocula. Join the conversation and share your thoughts.`,
        allowRobots: true
    })
}

const Fetcher = async ({ id, children }: PropsWithChildren<{ id: string }>) => {

    const queryClient = getQueryClient();
    const jar = await cookies();
    const user = await getUserFromToken(jar);

    const post = await fetchQuery({
        queryClient,
        queryKey: getQueryKeys("post_id", { id }),
        queryFn: () => getPostById(id),
    });

    // If Post is not found or if Post contains NSFW and user is below 18, show Not Found.
    if (!post || (post.nsfw && user && calculateAge(user.dob) < 18)) return (
        <NotFound
            title="Oops! Looks like the Popcorn Explorers couldn't find anything"
            paras={[
                "Possible reason: Post id is incorrect.",
                "Please search the Post by its title in the explore page.",
                "You can also search the author of the Post by their username."
            ]}
            fullScreen
        />
    )

    if (user) {
        const uid = user.user_id;
        await Promise.all([
            prefetchQuery({
                queryClient,
                queryKey: getQueryKeys("reaction_pid", { pid: id }),
                queryFn: () => getReactionOnPost(id, uid, jar),
            }),
            prefetchQuery({
                queryClient,
                queryKey: getQueryKeys("isContentSaved_type_id", { type: "post", id }),
                queryFn: () => checkIfItemSaved(id, uid, jar),
            }),
        ]);
    }

    const jsonLd = generateJsonLdForPost(post);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>

            <JsonLd schemas={jsonLd} />

            <PostHeader
                filterContent={user?.filterContent ?? true}
                uid={user?.user_id}
                id={id}
            />

            <div className="my-6">
                <TabContainer>
                    <TabList className="flex gap-2 flex-cntr-all" href={`/p/${id}`}>
                        <CommentIcon className="min-w-5" />
                        <span>Comments</span>
                    </TabList>
                    <TabList className="flex gap-2 flex-cntr-all" href={`/p/${id}/quotes`}>
                        <QuoteIcon className="min-w-5" />
                        <span>Quotes</span>
                    </TabList>
                    <OptionalChildren condition={user}>
                        <TabList className="flex gap-2 flex-cntr-all" href={`/p/${id}/reports`}>
                            <AlertIcon className="min-w-5" />
                            <span>Reports</span>
                        </TabList>
                    </OptionalChildren>
                </TabContainer>
            </div>

            {children}
        </HydrationBoundary>
    )
}

const PostLayout = async ({ children, params }: PropsWithChildren<ParloPageProps>) => {
    const { id } = await params;
    const [pid] = id.split('-');

    if (!isValidParloId(pid)) return (
        <main>
            <ShowError
                heading="Oops! Look's like you came across a wrong path."
                messages={[
                    "Post id is incorrect",
                    "Please search the post in explore page."
                ]}
                fullScreen
            />
        </main>
    );

    return (
        <main className="noPadding">
            <Suspense fallback={<PostPageSkeleton />}>
                <Fetcher id={pid}>
                    {children}
                </Fetcher>
            </Suspense>
        </main>
    )
}

export default PostLayout;