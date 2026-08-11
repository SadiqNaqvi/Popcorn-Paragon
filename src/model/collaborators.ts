import { getTimeInFuture, parloId } from "@lib/shared/utils";
import { CollaboratorModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

const collaboratorModel = new StrictSchema<CollaboratorModelType>({
    _id: { type: String, default: () => parloId(21) },
    shelf_id: {
        type: String,
        ref: "Shelf",
        required: true,
    },
    type: {
        type: String,
        enum: ["invitee", "collaborator"],
        default: "invitee",
    },
    user_id: {
        type: String,
        ref: "User",
        required: true,
    },
    expiresAt: {
        type: Date,
        default: new Date(getTimeInFuture({ unit: "d", timeVal: 7 })),
    }
}, { timestamps: true });

collaboratorModel.index({ shelf_id: 1, user_id: 1 }, { unique: true });
collaboratorModel.index({ user_id: 1, type: 1 });
collaboratorModel.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Collaborator: StrictModel<CollaboratorModelType> =
    (models.Collaborator as any) || model("Collaborator", collaboratorModel);

export default Collaborator;
