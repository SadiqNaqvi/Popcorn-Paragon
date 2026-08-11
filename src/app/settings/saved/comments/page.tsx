import { LoginModal } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils";
import { getSavedContent } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { cookies } from "next/headers";
import SavedSection from "../Section";

export const generateMetadata = (): Metadata => {
    return { title: "Saved Comments" }
}

const SavedCommentsPage = async () => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);
    const queryClient = getQueryClient();

    if (!user) return (
        <LoginModal redirectTo="/settings/saved/comments" />
    )

    const { user_id } = user;

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getSavedContent(user_id, "comment", 1),
        queryKey: getQueryKeys(`saved-comments_uid`, { uid: user_id }),
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SavedSection type="comment" uid={user_id} />
        </HydrationBoundary>
    )

}

export default SavedCommentsPage;