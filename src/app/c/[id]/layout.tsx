import { NotFound } from "@components/fallbacks";
import CommentPageSkeleton from "@components/ui/loading/CommentPageSkeleton";
import { getUserFromToken } from "@lib/backend/utils";
import { checkIfItemSaved, checkIfReportExists, checkLikeOnComment, getCommentById } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient, prefetchQuery } from "@lib/backend/providers/queryClient";
import { calculateAge, getQueryKeys, isValidParloId } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { PropsWithChildren, Suspense } from "react";
import CommentHeader from "./Header";
import JsonLd from "@components/JsonLd";
import { generateJsonLdForComment } from "@lib/shared/seo/jsonld";
import generateDynamicMetadata from "@lib/shared/seo/metadata";

export const generateMetadata = async ({ params }: ParloPageProps): Promise<Metadata> => {

    const cid = (await params).id.split('-')[0];

    const fallbackMetadata = generateDynamicMetadata({});

    if (!isValidParloId(cid))
        return fallbackMetadata;

    const { success, result } = await getCommentById(cid);

    if (!success || !result)
        return fallbackMetadata;

    const { username, content } = result;

    return generateDynamicMetadata({
        title: `Comment by ${username || "Parlocula User"}`,
        description: `${content ? content + ' - ' : ''} View this comment and join the discussion. Explore related posts, replies, and community conversations.`,
        allowRobots: true,
    });
}

const Fetcher = async ({ cid, children }: PropsWithChildren<{ cid: string }>) => {

    const queryClient = getQueryClient();

    const jar = await cookies();

    const user = await getUserFromToken(jar);

    const comment = await fetchQuery({
        queryKey: getQueryKeys("comment_cid", { cid }),
        queryFn: () => getCommentById(cid),
        queryClient,
    });

    // If comment is not found or if comment contains NSFW and user is below 18, show Not Found.
    if (!comment || (comment.nsfw && user && calculateAge(user.dob) < 18)) return (
        <NotFound
            title="Oops! Looks like the Popcorn Explorers couldn't find anything"
            paras={[
                "Possible reason: Comment id is incorrect.",
                "Please search the comment by its content in the explore page.",
                "You can also search the author of the comment by their username."
            ]}
            fullScreen
        />
    )

    else if (user) {
        await Promise.all([
            prefetchQuery({
                queryKey: getQueryKeys("like_cid", { cid }),
                queryFn: () => checkLikeOnComment(cid, user.user_id, jar),
                queryClient,
            }),
            prefetchQuery({
                queryKey: getQueryKeys("isContentSaved_type_id", { type: "comment", id: cid }),
                queryFn: () => checkIfItemSaved(cid, user.user_id, jar),
                queryClient,
            }),
            prefetchQuery({
                queryKey: getQueryKeys("ifReportExists_cnid_type", { type: "comment", cnid: cid }),
                queryFn: () => checkIfReportExists(cid, user.user_id, "comment", jar),
                queryClient,
            }),
        ]);
    }

    const jsonLd = generateJsonLdForComment(comment);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>

            <JsonLd schemas={jsonLd} />
            <CommentHeader
                filterContent={user?.filterContent ?? true}
                uid={user?.user_id}
                id={cid}
            />
            {children}
        </HydrationBoundary>
    )
}

const CommentLayout = async ({ children, params }: PropsWithChildren<ParloPageProps>) => {

    const cid = (await params).id.split('-')[0];

    if (cid && !isValidParloId(cid)) return (
        <NotFound
            title="Oops! Look's like you came across a wrong path."
            paras={["Incorrect comment id!", "Please search the comment by its content in the explore page."]}
            fullScreen
            redirectToExplore
        />
    );

    return (
        <main className="noPadding">
            <Suspense fallback={<CommentPageSkeleton />}>
                <Fetcher cid={cid}>{children}</Fetcher>
            </Suspense>
        </main>
    )
}

export default CommentLayout;