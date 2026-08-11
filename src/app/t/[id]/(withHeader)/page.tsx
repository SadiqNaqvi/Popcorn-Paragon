import { getQueryClient } from "@lib/backend/providers/queryClient"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import PostsTab from "./posts"
import { contentFetcher } from "./utils"
import { getUserFromToken } from "@lib/backend/utils"
import { cookies } from "next/headers"
import { ParloPageProps } from "@type/other"

const Page = async ({ params, searchParams }: ParloPageProps) => {

    const { id } = await params;
    const queryClient = getQueryClient();

    const user = await getUserFromToken(await cookies());

    const allowNsfw = user ? !user.filterContent : false;
    const sp = await searchParams;
    const response = await contentFetcher({
        queryClient, id, searchParams: sp, section: "posts", allowNsfw,
    });

    if (!response) return null;

    const { filter, page, category, tid } = response;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <PostsTab
                allowNsfw={allowNsfw}
                section="posts"
                category={category}
                id={tid}
                filter={filter}
                page={page}
            />
        </HydrationBoundary>
    )
}

export default Page;