import { parloId } from "@lib/shared/utils";
import { BookmarkModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

const bookmarkModel = new StrictSchema<BookmarkModelType>({
  _id: { type: String, default: () => parloId(21) },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  content_id: {
    type: String,
    refPath: "content_type",
    required: true,
  },
  content_type: {
    type: String,
    enum: ["Post", "Comment", "Shelf"],
  },
  createdAt: { type: Date, default: Date.now },
});

bookmarkModel.index({ user_id: 1, content_id: 1 }, { unique: true });
bookmarkModel.index({ user_id: 1, content_type: 1 });

const Bookmark: StrictModel<BookmarkModelType> =
  (models.Bookmark as any) || (model("Bookmark", bookmarkModel));

export default Bookmark;
