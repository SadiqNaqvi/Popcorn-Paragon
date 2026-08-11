import { oneDayInSeconds } from "@lib/shared/constants";
import { parloId } from "@lib/shared/utils";
import { MessageModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";

export const messageModel = new StrictSchema<MessageModelType>({
  _id: { type: String, default: () => parloId(21) },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  room_id: {
    type: String,
    ref: "Room",
    required: true,
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  username: { type: String, required: true },
  replied_to: { type: String, ref: 'Message', required: false, default: undefined },
  replied_content: { type: String, ref: 'Message', required: false, default: undefined },
  sharedContent: String,
});

messageModel.index({ createdAt: 1 }, { expireAfterSeconds: oneDayInSeconds * 3 });
messageModel.index({ room_id: 1, createdAt: 1 });

const Message: StrictModel<MessageModelType> =
  (models.Message as any) || model("Message", messageModel);

export default Message;
