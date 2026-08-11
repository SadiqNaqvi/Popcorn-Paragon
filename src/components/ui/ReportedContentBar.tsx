import { ReportedContent } from "@type/internal";
import { PropsWithChildren } from "react";
import { CommentBarForReport } from "./CommentBar";
import OptionalChildren from "./OptionalChildren";
import { PostBarForReportList } from "./PostBar";
import { allReasonsToReport } from "@lib/shared/constants";
import { UidsForReportReason } from "@type/other";

const ReasonTiles = ({ reasons, total }: Pick<ReportedContent, "reasons" | "total">) => {
    return (
        <div className="flex gap-2 items-center">
            <h5 className="whitespace-nowrap">Total Reasons: {total}</h5>
            <ul className="flex gap-2 overflow-x-auto noScroll">
                {Object.entries(reasons).map(([r, f]) => (
                    <li key={r} className="whitespace-nowrap w-fit space-x-2 px-3 py-2 rounded-xl border border-gray30">
                        <span>{allReasonsToReport[r as UidsForReportReason]}</span>
                        <span className="px-2 py-1 bg-gray40 rounded-full text-sm">{f}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const ContentBar = ({ content, content_type, _id, author }: ReportedContent) => {
    if (content_type === "comment") return (
        <CommentBarForReport {...content} {...author} _id={_id} />
    )

    return (
        <PostBarForReportList {...content} {...author} _id={_id} />
    )
}

const ReportedContentBar = ({ content, children }: PropsWithChildren<{ content: ReportedContent }>) => {

    return (
        <div className="p-2 my-2 border border-gray10 bg-gray10 sm:rounded-md">
            <ContentBar {...content} />
            <ReasonTiles reasons={content.reasons} total={content.total} />
            <OptionalChildren condition={content.content.warnedOn}>
                <p className="my-2 text-sm text-center">
                    The author of this {content.content_type} has been already warned on {new Date(content.content.warnedOn!).toLocaleString()}
                </p>
            </OptionalChildren>
            {children}
        </div>
    )
}

export default ReportedContentBar;