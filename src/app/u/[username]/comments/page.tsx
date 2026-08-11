import { getCommentsOfUser, getUserByUsername } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys, refineSearchParams } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import Comments from "../tabs/CommentSection";
import FilterTiles from "@components/FilterTiles";
import { cookies } from "next/headers";
import { getUserFromToken } from "@lib/backend/utils";
import { ParloPageProps } from "@type/other";

const Page = async ({ params, searchParams }: ParloPageProps) => {

    const queryClient = getQueryClient();
    const { username } = await params;
    const { f, p } = await searchParams;

    const currentUser = await getUserFromToken(await cookies());


    const user = await fetchQuery({
        queryClient,
        queryFn: () => getUserByUsername(username),
        queryKey: getQueryKeys("user_username", { username }),
    });

    if (!user) return null;

    const uid = user._id;
    const allowNsfw = currentUser ? currentUser.user_id === user._id ? true : !currentUser.filterContent : false;

    const { filter, page } = refineSearchParams("comments", p, f);

    await prefetchInfiniteQuery({
        queryKey: getQueryKeys("commentsOfUser_uid_filter", { uid, filter }),
        queryFn: () => getCommentsOfUser(uid, page, allowNsfw, filter),
        initialPageParam: page,
        queryClient,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <div className="my-4 px-2">
                <FilterTiles type="comments" />
            </div>
            <Comments allowNsfw={allowNsfw} uid={uid} filter={filter} page={page} />
        </HydrationBoundary>
    )
}

export default Page;