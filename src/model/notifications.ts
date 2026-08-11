import { oneWeekInSeconds } from "@lib/shared/constants";
import { parloId } from "@lib/shared/utils";
import { NotificationModelType } from "@type/models";
import type { StrictModel } from "@type/mongoose";
import { model, models, Schema, StrictSchema } from "@type/mongoose";

const messageItemSchema = new StrictSchema(
  {
    type: {
      type: String,
      required: true,
      enum: ["text", "link"],
    },
    text: {
      type: String,
      required: function (this: any) {
        return this.type === "text";
      },
    },
    label: {
      type: String,
      required: function (this: any) {
        return this.type === "link";
      },
    },
    path: {
      type: String,
      required: function (this: any) {
        return this.type === "link";
      },
    },
  }
);

const notificationModel = new StrictSchema<NotificationModelType>({
  _id: { type: String, default: () => parloId(21) },
  message: {
    type: [messageItemSchema],
    required: true,
  },
  title: { type: String, required: true },
  poster: String,
  path: String,
  user_id: { type: String, ref: "User", required: true },
  type: {
    type: String,
    enum: ["request", "informative"],
    default: "informative",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "denied"],
  },
  request_type: String,
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  content_id: {
    type: String,
    required: function (this: any) {
      return this.type === "request";
    },

  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

notificationModel.index({ user_id: 1, type: 1 });
notificationModel.index({ content_id: 1, user_id: 1 }, { partialFilterExpression: { $exists: true } });
notificationModel.index({ createdAt: 1 }, { expireAfterSeconds: oneWeekInSeconds });

const Notification: StrictModel<NotificationModelType> =
  (models.Notification as any) || model("Notification", notificationModel);

export default Notification;
