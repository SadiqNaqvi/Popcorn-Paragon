import FilterTiles from "@components/FilterTiles";
import { getCommentsOnPost } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys, isValidParloId, refineSearchParams } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CommentSection from "./tabs/CommentSection";
import { getUserFromToken } from "@lib/backend/utils";
import { cookies } from "next/headers";
import { ParloPageProps } from "@type/other";

const Page = async ({ params, searchParams }: ParloPageProps) => {

    const queryClient = getQueryClient();

    const { id } = await params;

    const pid = id.split('-')[0];
    if (pid && !isValidParloId(pid)) return null;

    const sp = await searchParams;

    const { filter, page } = refineSearchParams("comments", sp.p, sp.f);

    const user = await getUserFromToken(await cookies());

    const allowNsfw = user ? !user.filterContent : false;

    await prefetchInfiniteQuery({
        queryClient,
        queryKey: getQueryKeys('commentsOfPost_pid_filter', { pid, filter }),
        queryFn: () => getCommentsOnPost(pid, page, filter, allowNsfw),
        initialPageParam: page,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <section className="my-6 px-2">
                <FilterTiles type="comments" />
            </section>
            <CommentSection allowNSFW={allowNsfw} filter={filter} id={pid} page={page} />
        </HydrationBoundary>
    )
}

export default Page;