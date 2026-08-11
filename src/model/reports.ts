import { allReasonsToReport } from "@lib/shared/constants";
import { parloId } from "@lib/shared/utils";
import { ReportModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

const reportModel = new StrictSchema<ReportModelType>({
  _id: { type: String, default: () => parloId(21) },
  user_id: {
    type: String,
    ref: "Report",
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: Object.keys(allReasonsToReport)
  },
  details: String,
  ext_id: String,
  content_id: {
    type: String,
    refPath: "content_type",
    required: true,
  },
  content_type: {
    type: String,
    enum: ["Post", "Comment", "User", "Thread"],
  },
}, { timestamps: true });

reportModel.index({ content_id: 1, content_type: 1, user_id: 1 });
reportModel.index({ content_type: 1, ext_id: 1 }, { partialFilterExpression: { $exists: "$ext_id" } });

const Report: StrictModel<ReportModelType> =
  (models.Report as any) || model("Report", reportModel);

export default Report;
