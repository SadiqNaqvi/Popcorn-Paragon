import {
  bookmarkSchema,
  commentSchema,
  commentSchemaUpdate,
  emailUpdateSchema,
  frameDataSchema,
  itemSchema,
  itemsForShelfSchema,
  likeSchema,
  linkSchema,
  messageSchema,
  postClientSchema,
  postSchemaServer,
  postUpdateSchema,
  registerUserSchemaClient,
  registerUserSchemaServer,
  reportActionSchema,
  reportOrSuggestionSchemaClient,
  reportOrSuggestionSchemaServer,
  reportSchema,
  roomSchema,
  roomUpdateSchema,
  sessionInvalidationSchemaServer,
  sharedContentSchema,
  shelfClientUpdateSchema,
  shelfEditSchema,
  shelfServerSchema,
  taleonToAddAndRemove,
  threadSchemaServer,
  threadUpdateSchema,
  usernameUpdateSchema,
  userUpdateSchema
} from "@lib/shared/validation/schemas";
import { z } from "zod";
import { CommentReplyType } from "./internal";
import { UidsForReportReason } from "./other";

export type ExtMediaSource = "mega" | "youtube" | "vimeo" | "web";

export type LinkSchema = z.infer<typeof linkSchema>;
export type FrameDataSchemaType = z.infer<typeof frameDataSchema>;
export type ReportSchemaType = Omit<z.infer<typeof reportSchema>, "reason"> & { reason: UidsForReportReason };

export type ThreadSchemaServer = z.infer<typeof threadSchemaServer>;
export type ThreadUpdateSchema = z.infer<typeof threadUpdateSchema>;

export type PostSchemaType = z.infer<typeof postSchemaServer>;
export type PostUpdateSchemaType = z.infer<typeof postUpdateSchema>;
export type PostClientSchemaType = z.infer<typeof postClientSchema>

export type CommentSchemaUpdateType = z.infer<typeof commentSchemaUpdate>;
export type CommentSchemaType = z.infer<typeof commentSchema>;

export type ShelfSchemaType = z.infer<typeof shelfServerSchema>;
export type ShelfEditSchemaType = z.infer<typeof shelfEditSchema>;
export type ShelfUpdateSchemaClient = z.infer<typeof shelfClientUpdateSchema>;
export type TaleonToAddAndRemoveType = z.infer<typeof taleonToAddAndRemove>;
export type ItemsForShelfSchemaType = z.infer<typeof itemsForShelfSchema>;

export type BookmarkSchemaType = z.infer<typeof bookmarkSchema>;

export type LikeSchemaType = z.infer<typeof likeSchema>;

export type UserSchemaType = z.infer<typeof registerUserSchemaServer>;
export type UserUpdateSchemaType = z.infer<typeof userUpdateSchema>;
export type RegisterSchemaClientType = z.infer<typeof registerUserSchemaClient>;

export type RoomSchemaType = z.infer<typeof roomSchema>;
export type RoomUpdateSchemaType = z.infer<typeof roomUpdateSchema>;
export type MessageSchemaType = z.infer<typeof messageSchema>;
export type SharedContentSchemaType = z.infer<typeof sharedContentSchema>;

export type ReportActionSchemaType = z.infer<typeof reportActionSchema>

export type SessionInvalidationServerSchemaType = z.infer<typeof sessionInvalidationSchemaServer>

export type UsernameUpdateSchemaType = z.infer<typeof usernameUpdateSchema>;
export type EmailUpdateSchemaType = z.infer<typeof emailUpdateSchema>;

type CommanInputFrame = {
  path: string;
  type: "image" | "video";
  shouldUpload: boolean;
  size?: number;
  hash?: string;
  extSource?: ExtMediaSource;
  thumb: string | undefined;
  duration: number | undefined;
};

export type InputFrame = CommanInputFrame &
  ({ blob: null; isExternal: true } | { blob: Blob; isExternal: false });

export type ReplyInputType = CommentReplyType & { replied_to: string | undefined, username: string | undefined }

export type TaleonSchemaType = z.infer<typeof itemSchema>

export type ConfirmedTaleon = Omit<TaleonSchemaType, "taleon_id"> & { taleon_id: string };

export type AvailableActionsForReport = "keep" | "delete" | "warn"

export type ReportTypeEnum = "post" | "comment" | "user" | "thread";

export type AppBugOrSuggestionSchemaClient = z.infer<typeof reportOrSuggestionSchemaClient>
export type AppBugOrSuggestionSchemaServer = z.infer<typeof reportOrSuggestionSchemaServer>