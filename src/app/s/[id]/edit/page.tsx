import { LoginModal } from "@components/fallbacks";
import { ShelfMutation } from "@components/form/Mutation";
import { NotFound, ShowError } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils";
import { getItems, getShelf } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys, isValidParloId } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";

const Page = async ({ params }: ParloPageProps) => {

    const queryClient = getQueryClient();
    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return <LoginModal />

    const { id } = await params;

    const sid = id.split('-')[0];

    if (!isValidParloId(sid)) return (
        <NotFound
            title="Oops! Look's like you came across a wrong path."
            paras={["Content id is incorrect", "Please go back and try again."]}
        />
    );

    const [shelf] = await Promise.all([
        fetchQuery({
            queryKey: getQueryKeys("shelf_sid", { sid }),
            queryFn: () => getShelf(sid, user.user_id, undefined, jar),
            queryClient,
        }),
        prefetchInfiniteQuery({
            queryClient,
            queryKey: getQueryKeys('itemsOfShelf_sid_filter', { sid, filter: "latest" }),
            queryFn: () => getItems(sid, user?.user_id, 1, "latest", undefined, jar),
            initialPageParam: 1,
        }),
    ]);

    if (!shelf) return (
        <NotFound
            title="Uh oh! The Parlocula Explorers came empty handed."
            paras={[
                "Possible Reason: Shelf id is incorrect or shelf is deleted.",
                "If you think none of the above is true, please file a report.",
                "You can file a report to us in the settings page."
            ]}
        />
    )

    else if (shelf.user_id !== user.user_id) return (
        <ShowError
            heading="Uh oh! The Parlocula Guards caught you."
            errCode="unauthorized_access"
        />
    )

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ShelfMutation isEditing={true} defaultVals={shelf} />
        </HydrationBoundary>
    )
}

export default Page;