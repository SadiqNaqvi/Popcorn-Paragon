import { oneWeekInMiliSeconds } from "@lib/shared/constants";
import { parloId } from "@lib/shared/utils";
import { RoomModelType } from "@type/models";
import { model, models, Schema, StrictSchema } from "@type/mongoose";
import type { StrictModel, } from "@type/mongoose";

import { frameModel, numberSchema } from "./general";

const roomModel = new StrictSchema<RoomModelType>({
  _id: { type: String, default: () => parloId() },
  participants: [String],
  participant_count: { ...numberSchema, default: 1 },
  type: {
    type: String,
    enum: ["private", "group"],
    required: true,
  },
  name: String,
  poster: frameModel,
  lastMessage: { type: String, required: true },
  lastMessageAt: { type: Date, required: true },
  lastMessageBy: { type: String, required: true },
  invitationMessage: {
    type: new Schema({
      content: String,
      user_id: String,
      username: String,
      createdAt: Number,
    }),
    required: true,
  },
  expiresAt: {
    type: Date,
    default: new Date(Date.now() + oneWeekInMiliSeconds)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

roomModel.index({ participants: 1 }, {
  unique: true,
  partialFilterExpression: { $exists: true }
});

roomModel.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Room: StrictModel<RoomModelType> =
  (models.Room as any) || model("Room", roomModel);

export default Room;
