import { getQuotesOfPost } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys, isValidParloId } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import QuoteSection from "../tabs/QuoteSection";
import { getUserFromToken } from "@lib/backend/utils";
import { cookies } from "next/headers";
import { ParloPageProps } from "@type/other";

const QuotesPage = async ({ params, searchParams }: ParloPageProps) => {

    const queryClient = getQueryClient();

    const { id } = await params;
    const sp = await searchParams;

    const pid = id.split('-')[0];
    if (pid && !isValidParloId(pid)) return null;

    const page = parseInt(sp.p || "1") || 1;

    const user = await getUserFromToken(await cookies());

    const allowNsfw = user ? !user.filterContent : false;

    await prefetchInfiniteQuery({
        queryClient,
        queryKey: getQueryKeys('quotes_pid', { pid }),
        queryFn: () => getQuotesOfPost(pid, page, allowNsfw),
        initialPageParam: page,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <QuoteSection allowNsfw={allowNsfw} id={pid} page={page} />
        </HydrationBoundary>
    )
}

export default QuotesPage;