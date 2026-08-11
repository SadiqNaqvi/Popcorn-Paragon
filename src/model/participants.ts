import { oneWeekInMiliSeconds } from "@lib/shared/constants";
import { parloId } from "@lib/shared/utils";
import { ParticipantModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

const participantModel = new StrictSchema<ParticipantModelType>({
  _id: { type: String, default: () => parloId(21) },
  hideAt: Date,
  mute: {
    type: Boolean,
    default: false,
  },
  room_id: {
    type: String,
    ref: "Room",
    required: true,
  },
  seenAt: Date,
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["participant", "invitee", "creator"],
  },
  expiresAt: {
    type: Date,
    default: new Date(Date.now() + oneWeekInMiliSeconds)
  },
}, { timestamps: true });

participantModel.index({ room_id: 1, user_id: 1 }, { unique: true });
participantModel.index({ user_id: 1, type: 1 });
participantModel.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Participant: StrictModel<ParticipantModelType> =
  (models.Participant as any) || model("Participant", participantModel);

export default Participant;
