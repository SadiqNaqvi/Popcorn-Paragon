import { parloId } from "@lib/shared/utils";
import { ShelfItemModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

const shelfItemModel = new StrictSchema<ShelfItemModelType>({
  _id: { type: String, default: () => parloId(21) },
  taleon_id: {
    type: String,
    ref: "Taleon",
    required: true,
  },
  shelf_id: {
    type: String,
    ref: "Shelf",
    required: true,
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  order: { type: Number, required: true },
  ext_id: { type: String, required: true },
  year: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

shelfItemModel.index({ shelf_id: 1, taleon_id: 1 }, { unique: true });
shelfItemModel.index({ taleon_id: 1, user_id: 1 });

const ShelfItem: StrictModel<ShelfItemModelType> =
  (models.ShelfItem as any) || model("ShelfItem", shelfItemModel);

export default ShelfItem;
