import { getHandler } from "@lib/backend/helpers/handlers";
import { reportAggregationPipeline } from "@lib/backend/helpers/pipelines";
import { Member } from "@model";
import Report from "@model/reports";
import { ReportedContentEnum } from "@type/internal";

export const GET = getHandler(async (r, params) => {
    const { id, cuid } = params;

    const sp = r.nextUrl.searchParams;
    const type = sp.get("t") || sp.get("type");
    const content_type = type && ["post", "comment", "thread", "user"].includes(type) ? type as ReportedContentEnum : undefined;

    if (!content_type)
        return { success: false, errCode: "custom_error", custom_error: "Content type is required" }

    else if (content_type === "thread") {
        const isManager = await Member.exists({
            thread_id: id,
            user_id: cuid,
            role: { $in: ["moderator", "creator"] }
        });

        if (!isManager) return {
            success: false,
            errCode: "unauthorized_access"
        }
    }

    const arr: { _id: string, count: number }[] = await Report.aggregate(
        reportAggregationPipeline(id, content_type)
    );

    return { success: true, result: { reports: arr } }
});