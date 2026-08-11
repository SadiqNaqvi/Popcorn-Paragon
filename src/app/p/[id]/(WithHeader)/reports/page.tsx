import { LoginModal, ShowError } from "@components/fallbacks";
import ReportSection from "@components/ReportSection";
import { getUserFromToken } from "@lib/backend/utils";
import { allReasonsToReport } from "@lib/shared/constants";
import { getReportReasonToCountMap, getReportsOnContent } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps, UidsForReportReason } from "@type/other";
import { cookies } from "next/headers";

const type = "post";

const PostReportsPage = async ({ params, searchParams }: ParloPageProps<{ id: string }, { rpt: UidsForReportReason }>) => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);
    const cnid = (await params).id.split('-')[0];

    if (!user) return (
        <LoginModal
            redirectTo={`/${type}/${cnid}/reports`}
        />
    )

    const { rpt } = await searchParams;

    const reason = rpt && allReasonsToReport[rpt] ? rpt : undefined;

    const uid = user.user_id;

    const queryClient = getQueryClient();

    const [resp] = await Promise.all([
        getReportReasonToCountMap(uid, cnid, type, jar),
        prefetchInfiniteQuery({
            queryFn: () => getReportsOnContent(uid, cnid, type, 1, reason, jar),
            queryKey: getQueryKeys("reports_cnid", { cnid }),
            queryClient,
        })
    ]);

    if (!resp.success) return (
        <ShowError
            heading="Oops! Parlocula Explorers got into trouble"
        />
    )

    else if (!resp.result.reports.length) return (
        <section className="h-size-screen flex flex-cntr-all">
            <p>This {type} has not been reported yet.</p>
        </section>
    )

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ReportSection cnid={cnid} reports={resp.result.reports} type={type} uid={uid} />
        </HydrationBoundary>
    )
}

export default PostReportsPage;