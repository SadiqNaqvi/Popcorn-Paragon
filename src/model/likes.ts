import { parloId } from "@lib/shared/utils";
import { LikesModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

const likeModel = new StrictSchema<LikesModelType>({
  _id: { type: String, default: () => parloId(21) },
  user_id: {
    type: String,
    required: true,
  },
  comment_id: {
    type: String,
    required: true,
  },
});

likeModel.index({ user_id: 1, comment_id: 1 }, { unique: true });

const Like: StrictModel<LikesModelType> =
  (models.Like as any) || model<LikesModelType>("Like", likeModel);

export default Like;
