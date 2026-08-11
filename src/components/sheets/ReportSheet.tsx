"use client";

import { allReasonsToReport, contentReportOptions, threadReportOptions, userReportOptions } from "@lib/shared/constants";
import { checkIfReportExists } from "@lib/shared/helpers/internal_fetchers";
import { useQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import { useState } from "react";
import { Form, Textarea } from "../form";
import Choice from "../form/Choice";
import { CheckIcon } from "@assets/Icons";
import { ReportTypeEnum } from "@type/schemas";
import { submitReportMutation } from "@lib/frontend/helpers/mutations";
import { Button, OptionalChildren } from "../ui";
import { UidsForReportReason } from "@type/other";
import { toast } from "sonner";

const ReportSheet = ({ id, type, uid, ext_id }: { type: ReportTypeEnum, id: string, uid: string, ext_id: string | undefined }) => {

    const { data } = useQueryHook({
        queryFn: () => checkIfReportExists(id, uid, type),
        queryKeys: getQueryKeys("ifReportExists_cnid_type", { cnid: id, type }),
    });

    const [chosenOption, setChosenOption] = useState<UidsForReportReason | ''>('');

    if (data) return (
        <section className="px-2">
            <div className="mx-auto mb-4 p-4 size-fit aspect-square bg-green-500/20 rounded-full">
                <CheckIcon className="color-invert size-20" />
            </div>
            <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-center">You have successfully reported this {type}.</h4>
                <p className="text-center text-sm">Please wait while your report gets reviewed. You will be inform shortly.</p>
            </div>
            <div className="mt-8 space-y-2 w-fit mx-auto">
                <p className="text-sm">Reason: {allReasonsToReport[data.reason]}</p>
                <p className="text-sm">Details: {data.details || "No details were provided"}</p>
            </div>

        </section>
    )

    const reportOptions = type === "user" ? userReportOptions : type === "thread" ? threadReportOptions : contentReportOptions;

    const submitChoice = (c: { report: UidsForReportReason }) => {
        setChosenOption(c.report);
    }

    const submitReport = ({ details }: { details: string }) => {
        if (!chosenOption) {
            toast("Something went wrong. Please close and reopen the sheet and try again.");
            return;
        }

        submitReportMutation(uid, id, type,
            {
                content_id: id,
                content_type: type,
                reason: chosenOption,
                details,
                ext_id,
            }
        )
    }

    if (!chosenOption) return (
        <section className="px-2">
            <h4 className="text-center font-semibold">Help us make Parlocula a safe place for everyone, no matter their age.</h4>
            <OptionalChildren condition={type === "user" || type === "thread"}>
                <p className="text-sm mt-4 text-gray-500">
                    To help us understand the real problem, make sure to report the corrent thing. If a content (post or comment) voilates the flow of using the app, report the content instead.
                </p>
            </OptionalChildren>

            <Form className="mt-4" submit={submitChoice}>
                <div className="flex flex-wrap gap-2">
                    {reportOptions.map(o => (
                        <Choice key={o} type="radio" group="report" label={allReasonsToReport[o]} name={o} />
                    ))}
                </div>
                <div className="mt-4 bg-primary sticky w-full bottom-0 p-4 border-t border-gray30">
                    <Button
                        id="report-reason-submit"
                        title="Next"
                        type="submit"
                        className="primary w-full"
                    >
                        Next
                    </Button>
                </div>
            </Form>
        </section>
    )

    return (
        <section className="px-2">
            <h3 className="my-4 text-lg font-semibold">Selected: {allReasonsToReport[chosenOption]}</h3>
            <Form submit={submitReport}>
                <Textarea
                    name="details"
                    className="h-20"
                    description={chosenOption === "others" ? "Required" : "Optional"}
                    placeholder="Add details about your report. Please do not include any personal information or questions."
                />
                <Button
                    id="report-submit"
                    title="Submit"
                    className="primary w-full mt-4"
                    type="submit"
                >
                    Submit
                </Button>
            </Form>
        </section>
    )

}

export default ReportSheet;