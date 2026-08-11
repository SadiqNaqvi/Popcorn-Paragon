import { parloId } from "@lib/shared/utils";
import { SanctionModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

const sanctionModel = new StrictSchema<SanctionModelType>({
    _id: { type: String, default: () => parloId(21) },
    expiresAt: Date,
    metadata: Object,
    reason: { type: String, required: true },
    type: { type: String, enum: ["warning", "temp_ban", "perm_ban"], default: "warning" },
    userId: { type: String, ref: "User", required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

sanctionModel.index({ expiresAt: 1 }, {
    expireAfterSeconds: 0,
    partialFilterExpression: { $exists: true }
});

const Sanction: StrictModel<SanctionModelType> =
    (models.Sanction as any) || model("Sanction", sanctionModel);

export default Sanction;
