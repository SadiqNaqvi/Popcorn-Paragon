import { parloId } from "@lib/shared/utils";
import { ReactionModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";
import { Document } from "mongoose";

const reactionModel = new StrictSchema<ReactionModelType>({
  _id: { type: String, default: () => parloId(21) },
  reaction: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  post_id: {
    type: String,
    ref: "Post",
    required: true,
  },
}, { timestamps: true });

reactionModel.index({ post_id: 1, user_id: 1 }, { unique: true });

const Reaction: StrictModel<Document & ReactionModelType> =
  (models.Reaction as any) || model("Reaction", reactionModel);

export default Reaction;
