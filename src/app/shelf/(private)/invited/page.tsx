import { getUserFromToken } from "@lib/backend/utils";
import { getShelvesAsInvitee } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import ShelfList from "../ShelfList";

const InvitedShelvesPage = async () => {

    const user = await getUserFromToken(await cookies());
    if (!user) return null;

    const { user_id } = user;
    const queryClient = getQueryClient();

    await prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getShelvesAsInvitee(user_id, 1),
        queryKey: getQueryKeys("invitedShelvesOfUser_uid", { uid: user_id })
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ShelfList
                title="Invited Shelves"
                type="invited"
                uid={user_id}
            />
        </HydrationBoundary>
    )

}

export default InvitedShelvesPage;