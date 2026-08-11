import { parloId } from "@lib/shared/utils";
import { UserModelType } from "@type/models";
import type { StrictModel, } from "@type/mongoose";
import { model, models, StrictSchema } from "@type/mongoose";
import { frameModel, linkModel, numberSchema } from "./general";

const userModel = new StrictSchema<UserModelType>(
  {
    _id: { type: String, default: () => parloId(21) },
    name: String,
    username: {
      type: String,
      unique: true,
      required: true,
    },
    usernameUpdatedAt: { type: Date, default: undefined },
    email: {
      type: String,
      required: true,
    },
    emailUpdatedAt: Date,
    dob: { type: Date, required: true },
    bio: { type: String, default: "" },
    bioLinks: {
      type: [linkModel],
      default: [],
    },
    passkey: {
      type: String,
      required: true,
    },
    profile: frameModel,
    isActive: { type: Boolean, default: true },

    push_auth: String,
    push_endpoint: String,
    push_p256dh: String,

    // Metadata
    edited_at: { type: Date, default: null },
    session_id: String,
    lastLoginAt: { type: Date, default: Date.now },
    lastCommentedAt: Date,
    lastPostedAt: Date,
    lastShelfCreatedAt: Date,
    isBanned: { type: Boolean, default: false },
    banEndsAt: Date,
    filterContent: { type: Boolean, default: false },
    deletionId: String,

    tempBanned: numberSchema,
    followers: numberSchema,
    following: numberSchema,
    posts: numberSchema,
    comments: numberSchema,
    publicShelves: numberSchema,
    joinedThreads: numberSchema,
    createdThreads: numberSchema,
    reactions: numberSchema,
    likes: numberSchema,
    savedContents: numberSchema,
    rooms: numberSchema,
  },
  { timestamps: true }
);

userModel.index({ username: 1, isActive: 1 });
userModel.index({ email: 1 }, { unique: true });

const User: StrictModel<UserModelType> =
  (models.User as any) || model("User", userModel);

export default User;