import { parloId } from "@lib/shared/utils";
import { PostModelType } from "@type/models";
import type { StrictModel, } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";
import { frameModel, linkModel, numberSchema } from "./general";

const postModel = new StrictSchema<PostModelType>({
  _id: { type: String, default: () => parloId() },
  title: { type: String, required: true },
  body: { type: String, default: "" },
  links: [linkModel],
  links_count: Number,
  category: String,
  frames: [frameModel],
  frames_count: Number,
  nsfw: { type: Boolean, default: false },
  spoiler: { type: Boolean, default: false },
  thread_id: {
    type: String,
    ref: "Thread",
    required: true,
  },
  quoted_post_id: {
    type: String,
    ref: "Post",
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  edited_at: Date,
  comment_count: numberSchema,
  reaction_count: numberSchema,
  saved_count: numberSchema,
  quoted_count: numberSchema,

  warnedOn: Date,
}, { timestamps: true, _id: true });

postModel.index({ thread_id: 1, nsfw: 1 });
postModel.index({ user_id: 1, nsfw: 1 });

const Post: StrictModel<PostModelType> =
  (models.Post as any) || model("Post", postModel);

export default Post;
