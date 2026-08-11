import { oneDayInMiliSeconds } from "@lib/shared/constants";
import { parloId } from "@lib/shared/utils";
import { MembershipModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

const memberModel = new StrictSchema<MembershipModelType>({
  _id: { type: String, default: () => parloId(21) },
  thread_id: {
    type: String,
    ref: "Thread",
    required: true,
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  notification: { type: Boolean, default: true },
  banned: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["creator", "moderator", "member", "moderator_invitee"],
    default: "member",
  },
  actionsTaken: { type: Number, default: 0 },
}, { timestamps: true });

memberModel.index({ thread_id: 1, user_id: 1 }, { unique: true });
memberModel.index({ user_id: 1, banned: 1, role: 1, thread_id: 1 });

const Member: StrictModel<MembershipModelType> =
  (models.Member as any) || model("Member", memberModel);

export default Member;
