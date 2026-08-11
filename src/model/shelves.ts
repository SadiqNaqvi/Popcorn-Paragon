import { parloId } from "@lib/shared/utils";
import { ShelfModelType } from "@type/models";
import type { StrictModel, } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";
import { numberSchema } from "./general";

const shelfModel = new StrictSchema<ShelfModelType>({
  _id: { type: String, default: () => parloId() },
  name: {
    type: String,
    required: true,
  },
  poster: String,
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  shelfKey: String,
  last_added: Date,
  item_count: numberSchema,
  last_order: { type: Number, required: true },
  shelf_type: {
    type: String,
    enum: ["custom", "favourite", "recommended", "watched"],
    default: "custom",
  },
  saved_count: numberSchema,
}, { timestamps: true });

shelfModel.index({ user_id: 1, isPrivate: 1, shelf_type: 1 });
shelfModel.index({ name: 1, isPrivate: 1, shelf_type: 1 });

const Shelf: StrictModel<ShelfModelType> =
  (models.Shelf as any) || model("Shelf", shelfModel);

export default Shelf;
