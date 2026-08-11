import { getUserFromToken } from "@lib/backend/utils";
import { getShelvesAsCollaborator } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import ShelfList from "../ShelfList";

const CollaborativeShelvesPage = async () => {
    const jar = await cookies()
    const user = await getUserFromToken(jar);
    if (!user) return null;

    const { user_id } = user;
    const queryClient = getQueryClient();

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getShelvesAsCollaborator(user_id, 1, jar),
        queryKey: getQueryKeys("collaboratedShelvesOfUser_uid", { uid: user_id })
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ShelfList
                title="Collaborative Shelves"
                type="collaborative"
                uid={user_id}
            />
        </HydrationBoundary>
    )

}

export default CollaborativeShelvesPage;