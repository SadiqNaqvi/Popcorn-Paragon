"use client";

import { BottomSheet, InfiniteScroller, Navbar } from "@components";
import { Button, LoadingSpinner, OptionalChildren, ReportedContentBar } from "@components/ui";
import { actionOnReportedContents } from "@lib/frontend/helpers/mutations";
import { getReportedContents } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { useMutation } from "@tanstack/react-query";
import { ReportedContent } from "@type/internal";
import { AvailableActionsForReport, ReportActionSchemaType } from "@type/schemas";
import { useState } from "react";
import appToast from "@lib/frontend/providers/appToast";

type Props = {
    type: "post" | "comment",
    tid: string,
    uid: string,
}

const DetailsSection = ({ type }: Pick<Props, "type">) => {
    return (
        <section className="py-4">
            <BottomSheet
                state
                className="mx-auto text-center underline"
            >
                <div>
                    <div className="mb-4 space-y-2">
                        <h3 className="text-center font-semibold">Reported {type}s of thread.</h3>
                        <p className="text-sm text-center">Since you are the manager of this thread, it is your responsibility to take actions on these.</p>
                    </div>

                    <ul className="space-y-2 list-disc ml-4">
                        <li>You can either keep them, delete them or notify the author to update the {type} accordingly.</li>
                        <li>Action (keep): The {type} stays and all the reports on it will be deleted.</li>
                        <li>Action (delete): The {type} along with all the reports on it will be deleted.</li>
                        <li>Action (warn): The author of the {type} will be warned about these reports. The {type} along with all the reports on it will stay until one of the managers decides to keep or delete it.</li>
                        <li>It is adviced to give the author some time after warning them. But if the {type} breaks the rules of the thread/app, immediately delete the {type}.</li>
                        <li>The decision can be changed until you click on save button above.</li>
                    </ul>
                </div>
            </BottomSheet>
        </section>
    )
}

const ReportedContentsSection = ({ tid, type, uid }: Props) => {

    const [decisionBuffer, setDecisionBuffer] = useState<Map<string, AvailableActionsForReport>>(new Map());

    const qkeys = getQueryKeys("reportedContents_type_tid", { type, tid });

    const { isPending, mutate } = useMutation({
        mutationFn: (data: ReportActionSchemaType) =>
            actionOnReportedContents(tid, uid, data),
        onSuccess: () => {
            getQueryClient().refetchQueries({ queryKey: qkeys })
        }
    });

    const handleDecision = (id: string, action: AvailableActionsForReport) => {
        if (decisionBuffer.size >= 50) {
            appToast.error("Only 50 decisions are allowed to save at a time")
            return;
        }

        const temp = new Map(decisionBuffer);
        temp.set(id, action);
        setDecisionBuffer(temp);
    }

    const Component = (content: ReportedContent) => {

        const report = { ...content, content_type: type } as ReportedContent;

        return (
            <ReportedContentBar content={report}>
                <section className="mt-4">
                    <div className="grid gap-2 grid-cols-2 grid-rows-2 xs:grid-rows-1 xs:grid-cols-3">
                        <Button
                            id="action-keep-button"
                            title="Keep"
                            className={`secondary ${decisionBuffer.get(content._id) === "keep" ? "bg-zinc-50" : ''}`}
                            onClick={() => handleDecision(content._id, "keep")}
                        >
                            Keep
                        </Button>
                        <Button
                            id="action-warn-button"
                            title="Warn"
                            className={`secondary ${decisionBuffer.get(content._id) === "warn" ? "bg-zinc-50" : ''}`}
                            onClick={() => handleDecision(content._id, "warn")}
                        >
                            Warn
                        </Button>
                        <Button
                            id="action-delete-button"
                            title="Delete"
                            className={`secondary col-span-2 xs:col-span-1 ${decisionBuffer.get(content._id) === "delete" ? "bg-zinc-50" : ''}`}
                            onClick={() => handleDecision(content._id, "delete")}
                        >
                            Delete
                        </Button>
                    </div>
                    {decisionBuffer.has(content._id) && (
                        <p className="mt-2 text-center text-sm">Taken Decision: {decisionBuffer.get(content._id)}</p>
                    )}
                </section>
            </ReportedContentBar >
        )
    }

    const handleSave = () => {
        if (decisionBuffer.size < 1 || decisionBuffer.size > 50)
            appToast.error("At least 1 upto 50 decisions are allowed to save at a time.")

        const actions = decisionBuffer
            .entries()
            .map(([k, v]) => ({ id: k, action: v }))
            .toArray();

        mutate({ actions, type });
    }

    return (
        <>
            <OptionalChildren condition={isPending}>
                <div className="overflow-hidden fixed inset-0">
                    <LoadingSpinner />
                </div>
            </OptionalChildren>

            <Navbar
                navTitle="Reported Posts"
                OptionButton={(
                    <Button
                        id="submit-button"
                        title="Save"
                        className="primary"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                )}
            />

            <DetailsSection type={type} />

            <InfiniteScroller
                Component={Component}
                fetchData={(p) => getReportedContents(tid, uid, type, p)}
                queryKeys={qkeys}
            />
        </>
    )


}

export default ReportedContentsSection;