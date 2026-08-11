"use client";

import { allReasonsToReport } from "@lib/shared/constants";
import { getReportsOnContent } from "@lib/shared/helpers/internal_fetchers";
import { useChageSearchParams } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import { ReportsType } from "@type/internal";
import { UidsForReportReason } from "@type/other";
import { ReportTypeEnum } from "@type/schemas";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import InfiniteScroller from "./InfiniteScroller";
import { Button } from "./ui";

type Props = {
    cnid: string,
    type: ReportTypeEnum,
    uid: string,
    reports: ReportsType[],
};

const ReportHeader = ({ reports }: { reports: ReportsType[] }) => {

    const { searchParams, addToSearchParams } = useChageSearchParams();
    const [selectedReason, setSelectedReason] = useState<UidsForReportReason | undefined>();

    useEffect(() => {
        const type = searchParams.get("rpt") as UidsForReportReason | null;
        if (type && allReasonsToReport[type]) {
            setSelectedReason(type);
        }
    }, []);

    const handleSelection = (type: UidsForReportReason) => {
        setSelectedReason(type);
        addToSearchParams({ rpt: type, p: 0 });
    }

    return (
        <ul className="flex mb-4 overflow-x-auto noScroll">
            {reports.map(({ _id, count }) => (
                <li
                    key={_id}
                    className={`w-fit border-2 rounded-full ${selectedReason === _id ? "border-secondary" : "border-gray20"}`}
                >
                    <Button
                        id={`reports-tile-${_id}`}
                        title={_id}
                        onClick={() => handleSelection(_id)}
                        className="px-4 py-2 flex gap-2 items-center">
                        <span>{allReasonsToReport[_id]}</span>
                        <span className="px-2 py-1 bg-gray30 rounded-full text-xs">{count}</span>
                    </Button>
                </li>
            ))}
        </ul>
    )


}

const ReportDetailsBar = ({ details }: { details: string }) => (
    <>
        {details}
    </>
)

const ReportBody = ({ cnid, type, uid }: Omit<Props, "reports">) => {

    const sp = useSearchParams();

    const rpt = sp.get("rpt") as UidsForReportReason | null;
    const reason = rpt && allReasonsToReport[rpt] ? rpt : undefined;

    return (
        <div className="space-y-4 my-4">
            <h4 className="parloHeading">Given Details</h4>
            <InfiniteScroller
                Component={ReportDetailsBar}
                fetchData={(p) => getReportsOnContent(uid, cnid, type, p, reason)}
                queryKeys={getQueryKeys("reports_cnid", { cnid })}
                className="list-circle list-inside space-y-4"
                NotFoundSection={(
                    <div className="size-full flex flex-cntr-all">
                        <p>No details have been provided</p>
                    </div>
                )}
            />
        </div>
    )
}

const ReportSection = ({ reports, ...rest }: Props) => {
    return (
        <section className="h-size-screen px-2">
            <ReportHeader reports={reports} />
            <ReportBody {...rest} />
        </section>
    )
}

export default ReportSection;