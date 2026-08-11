import { getHandler } from "@lib/backend/helpers/handlers";
import { createPipeline } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { allReasonsToReport } from "@lib/shared/constants";
import { capitalize } from "@lib/shared/utils";
import { Member } from "@model";
import Report from "@model/reports";
import { ReportedContentEnum } from "@type/internal";
import { UidsForReportReason } from "@type/other";

export const GET = getHandler(async (r, params) => {
    const { id, cuid } = params;

    const { page } = getSearchParams(r.nextUrl);
    const sp = r.nextUrl.searchParams;
    const type = sp.get("t") || sp.get("type");
    const reason = (sp.get("r") || sp.get("reason")) as UidsForReportReason;
    const correctReason = reason && allReasonsToReport[reason] ? reason : undefined;
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

    const results = await Report.aggregate(
        createPipeline({
            filters: [{
                $match: {
                    content_id: id,
                    content_type: capitalize(content_type),
                    ...(correctReason && { reason: correctReason }),
                    details: { $ne: undefined }
                }
            }],
            page,
            projection: {
                details: 1
            },
        })
    );

    return {
        success: true,
        result: results[0] ?? { data: [], total: 0 }
    }

})