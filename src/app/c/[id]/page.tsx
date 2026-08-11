import { getCommentById } from "@lib/shared/helpers/internal_fetchers"
import { getQueryClient, prefetchQuery } from "@lib/backend/providers/queryClient"
import { getQueryKeys, refineSearchParams } from "@lib/shared/utils"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import RepliesSection from "./RepliesSection"
import { ParloPageProps } from "@type/other"

const Page = async ({ params, searchParams }: ParloPageProps) => {

    const cid = (await params).id.split('-')[0];
    const sp = await searchParams;

    const { filter, page } = refineSearchParams("comments", sp.p, sp.f);

    const queryClient = getQueryClient();

    await prefetchQuery({
        queryKey: getQueryKeys("comment_cid", { cid }),
        queryFn: () => getCommentById(cid),
        queryClient,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <RepliesSection cid={cid} filter={filter} page={page} />
        </HydrationBoundary>
    )
}

export default Page;