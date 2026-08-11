import LoginModal from "@components/fallbacks/LoginModal";
import { NotFound, ShowError } from "@components/fallbacks";
import { FullPageLoadingSpinner } from "@components/ui/loading/LoadingSpinner";
import { getUserFromToken } from "@lib/backend/utils";
import { getThreadById } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";
import { PropsWithChildren, Suspense } from "react";

const Fetcher = async ({ id, children }: PropsWithChildren<{ id: string }>) => {

    const queryClient = getQueryClient();
    const user = await getUserFromToken(await cookies());

    if (!user) return (
        <LoginModal redirectTo={`/t/${id}/settings`} />
    )

    const thread = await fetchQuery({
        queryFn: () => getThreadById(id),
        queryKey: getQueryKeys("thread_id", { id }),
        queryClient
    });

    const { user_id } = user;

    if (!thread) return (
        <NotFound
            title="Uh oh! The Parlocula Explorers came empty handed."
            paras={["A Thread could not be found with the provided id.", "Please search the thread by it's name in the explore page."]}
            redirectToExplore
        />
    )

    else if (!(thread.created_by === user_id || thread.managers.find(({ _id }) => _id === user.user_id))) return (
        <ShowError
            heading="Uh oh! The Parlocula Cops detained you."
            errCode="unauthenticated_access"
            fullScreen
        />
    )

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {children}
        </HydrationBoundary>
    )

}

const ThreadSettingLayout = async ({ params, children }: PropsWithChildren<ParloPageProps>) => {

    const [id, ...rest] = (await params).id.split("-");

    return (
        <Suspense fallback={<FullPageLoadingSpinner path={rest} />}>
            <Fetcher id={id}>{children}</Fetcher>
        </Suspense>
    )
}

export default ThreadSettingLayout;