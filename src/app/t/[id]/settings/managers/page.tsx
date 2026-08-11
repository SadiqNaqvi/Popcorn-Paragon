import { getUserFromToken } from "@lib/backend/utils";
import { getManagers, getMembers } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery, prefetchQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import Managers from "./Managers";
import { ParloPageProps } from "@type/other";

const ManagerPage = async ({ params }: ParloPageProps) => {

    const { id } = await params;

    const queryClient = getQueryClient();
    const tid = id.split('-')[0];
    const jar = await cookies();
    const user = await getUserFromToken(jar);
    if (!user) return null;

    await prefetchQuery({
        queryClient,
        queryFn: () => getManagers(tid, user.user_id, jar),
        queryKey: getQueryKeys("threadManagers_tid", { tid }),
    });

    prefetchInfiniteQuery({
        queryClient,
        queryFn: () => getMembers(tid, 1),
        queryKey: getQueryKeys("members_tid", { tid }),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Managers tid={tid} />
        </HydrationBoundary>
    )

}

export default ManagerPage;