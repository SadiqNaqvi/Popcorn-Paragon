import { parloId } from "@lib/shared/utils";
import { TaleonModelType } from "@type/models";
import type { StrictModel, } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";
import { numberSchema } from "./general";

export const taleonModel = new StrictSchema<TaleonModelType>({
  _id: {
    type: String,
    default: () => parloId(21)
  },
  title: {
    type: String,
    required: true,
  },
  poster: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  taleon_type: {
    type: String,
    enum: ["movie", "show"],
    required: true,
  },
  ext_id: {
    type: String,
    required: true,
  },
  favourite: numberSchema,
  watched: numberSchema,
  recommended: numberSchema,
  editedAt: { type: Date, default: Date.now }
}, { timestamps: true });

taleonModel.index({ ext_id: 1 }, { unique: true });

const Taleon: StrictModel<TaleonModelType> =
  (models.Taleon as any) || model("Taleon", taleonModel);

export default Taleon;
