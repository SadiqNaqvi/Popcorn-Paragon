import { getUserFromToken } from "@lib/backend/utils";
import { getAllShelvesOfUser } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import ShelfList from "../ShelfList";

const AllShelfPage = async () => {

    const jar = await cookies();
    const user = await getUserFromToken(jar)

    if (!user) return;

    const queryClient = getQueryClient();

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getAllShelvesOfUser(user.user_id, 1, jar),
        queryKey: getQueryKeys("allShelvesOfUser_uid", { uid: user.user_id })
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ShelfList
                title="All Shelves"
                type="all"
                uid={user.user_id}
            />
        </HydrationBoundary>
    )

}

export default AllShelfPage;