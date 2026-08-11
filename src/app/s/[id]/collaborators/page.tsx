import LoginModal from "@components/fallbacks/LoginModal";
import { NotFound, ShowError } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils";
import { getCollaboratorsOfShelf, getFollowers } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ShelfCollaborators } from "@type/internal";
import { cookies } from "next/headers";
import Collaborators from "./CollaboratorsPage";
import { ParloPageProps } from "@type/other";

const CollaboratorsPage = async ({ params }: ParloPageProps) => {

    const { id } = await params;
    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return (
    <LoginModal
            redirectTo={`/s/${id}/collaborators`}
            title="Collaborators"
        />
    )

    const sid = id.split('-')[0];

    const queryClient = getQueryClient();

    const shelf = await fetchQuery<ShelfCollaborators>({
        queryKey: getQueryKeys("shelfCollaborators_sid", { sid }),
        queryFn: () => getCollaboratorsOfShelf(user.user_id, sid, jar),
        queryClient,
    });

    prefetchInfiniteQuery({
        queryKey: getQueryKeys("followersOfCurrentUser_uid", { uid: user.user_id }),
        queryFn: () => getFollowers(user.user_id, 1, jar),
        queryClient,
    });

    if (!shelf) return (
        <NotFound
            fullScreen
            title="Oops! Looks like the popcorn is missing"
            paras={["A Shelf could not be found with the provided id.", "Please search it in the explore page"]}
        />
    )

    else if (shelf.creator !== user.user_id) return (
        <ShowError
            fullScreen
            heading="Oops! Looks like we could'nt proceed"
            errCode="unauthorized_access"
        />
    )

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Collaborators uid={user.user_id} sid={sid} />
        </HydrationBoundary>
    )
}

export default CollaboratorsPage;