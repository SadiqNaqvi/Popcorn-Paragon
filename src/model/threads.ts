import { parloId } from "@lib/shared/utils";
import { ThreadModelType } from "@type/models";
import type { StrictModel, } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";
import { basedOnModel, frameModel, linkModel, numberSchema } from "./general";

const threadModel = new StrictSchema<ThreadModelType>({
  _id: { type: String, default: () => parloId() },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  poster: frameModel,
  nsfw: {
    type: Boolean,
    default: false,
  },
  links: {
    type: [linkModel],
    required: false,
    default: [],
  },
  connections: {
    type: [basedOnModel],
    default: []
  },
  created_by: {
    type: String,
    ref: "User",
    required: true,
  },
  edited_at: Date,
  edited_by: String,
  post_count: numberSchema,
  comment_count: numberSchema,
  lastCommentedAt: Date,
  lastPostedAt: Date,
  member_count: { ...numberSchema, default: 0 },
}, { timestamps: true });

threadModel.index({ name: 1 }, { unique: true });
threadModel.index({ created_by: 1 });

const Thread: StrictModel<ThreadModelType> =
  (models.Thread as any) || model("Thread", threadModel);

export default Thread;
