import { ConnectionModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";
import { parloId } from "@lib/shared/utils";

const connectionModel = new StrictSchema<ConnectionModelType>({
  _id: { type: String, default: () => parloId(21) },
  followee: {
    type: String,
    ref: "User",
    required: true,
  },
  follower: {
    type: String,
    ref: "User",
    required: true,
  },
  blocked: { type: Boolean, default: false },
  notification: { type: Boolean, default: true },
}, { timestamps: true });

connectionModel.index({ followee: 1, blocked: 1, follower: 1 }, { unique: true });
connectionModel.index({ follower: 1, blocked: 1 });

const Connection: StrictModel<ConnectionModelType> =
  (models.Connection as any) || (model("Connection", connectionModel));

export default Connection;
