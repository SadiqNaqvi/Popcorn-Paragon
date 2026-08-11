import { AllShelves } from "@type/models";
import {
  AvailableCacheTags,
  AvailableQueryKeys,
  AvailableRevalidateTags,
  ErrorCodes,
  ExternalImageTypeToSizeMap,
  QueryFilterType,
  ReportReasonType,
  UidsForReportReason
} from "@type/other";

export const searchFilters = [
  "all",
  "movies",
  "shows",
  "threads",
  "users",
  "posts",
  "shelves",
  "people",
  "collections",
  "companies",
];

export const app_production_url = process.env.NEXT_PUBLIC_PARLOCULA_URL ?? "https://parlocula.vercel.app";
export const parloculaAppURL =
  process.env.NODE_ENV === "development" ?
    "http://localhost:3000" :
    app_production_url

export const availablePostCategories = [
  "discussion",
  "question",
  "roast/joke",
  "information",
  "theory/speculations",
];

export const numberOfFrames = {
  total: 5,
  images: 3,
  videos: 2,
};

export const urlPattern =
  /^https:\/\/(www\.)?[a-zA-Z0-9-]{2,}(\.[a-zA-Z0-9-]{2,})+(\/[^\s]*)?(\?[^\s]*)?$/;

export const mediaUrlPattern =
  /^(https:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-%.~+\/]*)*(\.(jpg|jpeg|png|bmp|webp|mp4|mov|avi|mkv|flv|wmv|webm|3gp))(?=[\/?]|$)/i;

export const youtubeLinkPattern =
  /^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]{7,15})(?:[\?&][a-zA-Z0-9\_-]+=[a-zA-Z0-9\_-]+)*(?:[&\/\#].*)?$/i;

export const vimeoLinkPattern = /(?:https?:\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:[a-z]*\/)*([0-9]{6,11})/i;

export const megaFilePattern =
  /^https:\/\/mega(\.(nz|io))\/file\/[a-zA-Z0-9\_-]{3,}(\#)[a-zA-Z0-9\_-]{5,}$/;

export const passwordValidator =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

export const usernamePattern = /^[a-z][a-z0-9_]*$/;

export const emailPattern =
  /^[a-zA-Z]+[a-zA-Z0-9-\.]{2,}\@+[a-z]{4,}\.[a-z]{3,}$/;

export const externalImgUrlPrefix = "https://image.tmdb.org/t/p/";

export const backdrop_sizes: ExternalImageTypeToSizeMap["backdrop"][] = ["w300", "w780", "original"];
export const logo_sizes: ExternalImageTypeToSizeMap["logo"][] = [
  "w45",
  "w92",
  "w154",
  "w185",
  "w300",
  "w500",
  "original",
];

export const poster_sizes: ExternalImageTypeToSizeMap["poster"][] = [
  "w92",
  "w154",
  "w185",
  "w342",
  "w500",
  "original",
];
export const profile_sizes: ExternalImageTypeToSizeMap["profile"][] = ["w45", "w185", "original"];
export const still_sizes: ExternalImageTypeToSizeMap["still"][] = ["w92", "w185", "w300", "original"];

export const oneKb = 1024;
export const oneMb = oneKb * oneKb;

export const allowedSizes: Record<string, number> = {
  image: oneMb * 5,
  video: oneMb * 50,
};

export const allowedFormats: Record<string, string[]> = {
  image: ["jpg", "png", "jpeg", "webp", "bmp", "tiff", "tif", "heic"],
  video: ["mp4", "webm", "mkv"],
};

export const extMediaSource = ["mega", "youtube", "vimeo", "web"] as const;

export const queryLimit = 20;
export const recentlyJoinedLimit = 20;
export const emailLimit = 3;
export const postLinksLength = 5;
export const attachedFramesLimit = 5;
export const threadManagersLimit = 10;
export const participantsRemoveOrInviteLimit = 10;
export const participantsLimitForGroup = 50;
export const blockOrBanLimit = 10;
export const shelfCollaboratorsLimit = 10;
export const clientThreadsAndShelvesLimit = 50;

export const errorCodes: Record<ErrorCodes, { reason: string; message: string }> = {
  unknown_error: {
    reason: "Server side unknown error.",
    message:
      "Something went wrong on the server side! Please try again but if the error persist, please report it.",
  },
  database_connection_fail: {
    reason: "Database connection failure.",
    message:
      "Failed to connect to the database! Please check your connection and try again.",
  },
  media_upload_fail: {
    reason: "Media upload failure.",
    message:
      "Unable to upload the media files (images/videos) on our hosting provider! Please try again.",
  },
  resource_not_found: {
    reason: "Resource not found",
    message:
      "Unable to find the resource you're looking for! The resource might have been deleted.",
  },
  data_storing_fail: {
    reason: "Data Storing failure",
    message:
      "Unable to store the data in the database! Please try again but if the error persists, report it.",
  },
  session_store_fail: {
    reason: "Session failure",
    message:
      "Your account has been created but we're unable to store a session for you. Please log-in to continue.",
  },
  unstable_internet: {
    reason: "Unstable internet connection of the client.",
    message:
      "Looks like your internet connection is not stable! Please check your connection and try again.",
  },
  unauthorized_access: {
    reason: "Unauthorized user trying to access a private resource.",
    message: "You're not allowed to be here or use this feature.",
  },
  unauthenticated_access: {
    reason: "Un-Authenticated user trying to perform an action.",
    message: "You need to log in to perform this action.",
  },
  form_error: {
    reason: "Form Errors issued by zod.",
    message: "",
  },
  invalid_object_id: {
    reason: "Invalid Object Id found",
    message: "You have came across a wrong way! Please go back and try again.",
  },
  invalid_input: {
    reason: "Invalid Input data other than form data.",
    message:
      "You've given us a wrong information! Please check everything and try again.",
  },
  temporary_banned: {
    reason: "User is temporarily banned to perform post requests.",
    message:
      "You're temporarily banned to perform any post requests. Please try again in some days.",
  },
  rate_limit_exceed: {
    reason: "User hit rate limit.",
    message: "Oops! Looks like you are doing things too fast. Slow down, calm yourself and try again after some time."
  },
  blocked_by_author: {
    reason:
      "A post request could not complete because the current user is blocked by the author of the content.",
    message: "Something went wrong.",
  },
  not_a_member: {
    reason: "User has not joined the thread but trying to post in it.",
    message:
      "You need to be a member of the thread before start posting in it.",
  },
  email_verification_limit_exceed: {
    reason: "User has reached email verification limit.",
    message:
      "Unable to verify email. Please wait for about an hour and try again.",
  },
  wrong_passkey: {
    reason: "User has provided a wrong passkey while updating their info.",
    message: "Passkey is incorrect. Please try again",
  },
  early_identification_update: {
    reason:
      "User is trying to update identification fields i.e. username or email, within a month of last update.",
    message:
      "You cannot perform this action yet. Please wait for a month and try again.",
  },
  invalid_verification_code: {
    reason: "Incorrect verification code.",
    message: "Incorrect Code! Please try again.",
  },
  verification_code_expired: {
    reason: "Verification Code expired.",
    message: "Verification code has been expired! Please try again.",
  },
  uncaught_error: {
    reason: "Totally unknown error.",
    message: "Something went wrong! Please try again.",
  },
  missing_device_fingerprint: {
    reason: "Device fingerprint is not provided or stored.",
    message: "Looks like your device is un-registered. Please try re-sending verification email and try again."
  },
  unregistered_user: {
    reason: "User is not registered. This is not an error but a information to client that user needs to register first.",
    message: ""
  },
  custom_error: {
    reason: "A custom error. Not from anything listed above.",
    message: ""
  },
};

export const queryFilters: Record<QueryFilterType, string[]> = {
  threads: ["hot", "latest", "popular"],
  posts: ["hot", "latest", "controversial", "popular"],
  comments: ["loved", "latest"],
  userPosts: ["latest", "oldest", "popular"],
  shelves: ["latest", "a_to_z", "z_to_a", "recently_added"],
  items: ["latest", "year", "oldest"],
};

export const mediaInputConfig: Record<
  "image" | "video",
  { accept: string; size: { label: string; value: number } }
> = {
  image: {
    accept: ".jpg, .png, .jpeg, .webp, .avif",
    size: { label: "5mb", value: oneMb * 5 },
  },
  video: {
    accept: ".mp4, .3gp, .mkv, .mov, .m4v",
    size: { label: "50mb", value: oneMb * 50 },
  },
};

export const filterToSort: Record<QueryFilterType, any> = {
  threads: {
    hot: { createdAt: -1, post_count: -1, member_count: -1 },
    popular: { member_count: -1 },
    latest: { createdAt: -1 },
  },
  posts: {
    hot: { createdAt: -1, reaction_count: -1 },
    controversial: { createdAt: -1, comment_count: -1 },
    latest: { createdAt: -1 },
    popular: { reaction_count: -1 },
  },
  comments: {
    latest: { createdAt: -1 },
    loved: { comment_count: -1 },
  },
  userPosts: {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    popular: { reaction_count: -1 },
  },
  items: {
    order: { order: 1 },
    latest: { createdAt: -1 },
    year: { year: -1 },
  },
  shelves: {
    latest: { createdAt: -1 },
    a_to_z: { title: 1 },
    z_to_z: { title: -1 },
    recently_added: { last_added: -1 },
  },
};
export const oneMinInSeconds = 60;
export const oneMinInMiliSeconds = 1000 * oneMinInSeconds;
export const oneHourInSeconds = 3600;
export const oneHourInMiliSeconds = oneHourInSeconds * 1000;
export const oneDayInSeconds = oneHourInSeconds * 24;
export const oneDayInMiliSeconds = oneHourInMiliSeconds * 24;
export const oneWeekInSeconds = oneDayInSeconds * 7;
export const oneWeekInMiliSeconds = oneDayInMiliSeconds * 7;

export const queryKeys: Record<AvailableQueryKeys, string[]> = {
  user_username: ["user-{username}"],
  searchNonBlockedUser_query_uid: ["searchNonBlockedUser", "{query}", "{uid}"],
  connection_ruid: ["connection-{ruid}"],
  postsOfUser_uid_filter: [
    "posts",
    "{filter}",
    "user",
    "{uid}",
  ],
  searchBannedMembers_tid_query: [
    "search",
    "bannedMembers",
    "{tid}",
    "{query}",
  ],
  searchMembers_tid_query: ["search", "members", "{tid}", "{query}"],
  thread_id: ["thread", "{id}"],
  threadManagers_tid: ["threadManagers", "{tid}"],
  "saved-comments_uid": ["saved", "comments", "{uid}"],
  "saved-shelfs_uid": ["saved", "shelves", "{uid}"],
  "saved-posts_uid": ["saved", "posts", "{uid}"],
  joinedThreadsOfUser_uid: ["joined", "threads", "{uid}"],
  createdThreadsOfUser_uid: ["created", "threads", "{uid}"],
  threadsManageByUser_uid: ["manages", "threads", "{uid}"],
  threads_filter: ["threads", "{filter}"],
  membership_tid: ["membership", "{tid}"],
  bannedMembers_tid: ["banned-members", "{tid}"],
  members_tid: ["members", "{tid}"],
  postsOfThread_tid_filter_category: [
    "posts",
    "{filter}",
    "thread",
    "{tid}",
    "{category}",
  ],
  quotes_pid: ["quotes", "{pid}"],
  post_id: ["post", "{id}"],
  reaction_pid: ["reaction", "{pid}"],
  commentsOfPost_pid_filter: [
    "comments",
    "{filter}",
    "post",
    "{pid}",
  ],
  commentsOfUser_uid_filter: [
    "comments",
    "{filter}",
    "user",
    "{uid}",
  ],
  comment_cid: ["comment", "{cid}"],
  like_cid: ["like", "{cid}"],
  replies_cid_filter: ["replies", "{cid}", "{filter}"],

  popularShelves: ["popular-shelves"],
  shelf_sid: ["shelf", "{sid}"],
  shelvesOfUser_uid_filter: ["shelves-of-user", "{uid}", "{filter}"],
  itemsOfShelf_sid_filter: ["itemsOfShelf", "{sid}", "{filter}"],
  privateShelf_sid_key: ["privateShelf", "{sid}", "{key}"],
  itemsOfPrivateShelf_sid_key_filter: [
    "itemsOfPrivateShelf",
    "{sid}",
    "{filter}",
    "{key}",
  ],
  isContentSaved_type_id: ["saved", "{type}", "{id}"],
  notifications_uid: ["notifications-user", "{uid}"],
  shelfCollaborators_sid: ["collaborators-{sid}"],
  "search-followers_uid_query": ["search", "followers", "{uid}", "{query}"],
  "search-following_uid_query": ["search", "following", "{uid}", "{query}"],
  followersOfCurrentUser_uid: ["followers", "currentUser", "{uid}"],
  followingOfCurrentUser_uid: ["following", "currentUser", "{uid}"],
  blockedByCurrentUser_uid: ["blockedByCurrentUser", "{uid}"],
  rooms_uid: ["rooms", "{uid}"],
  messages_rmid: ["messages", "{rmid}"],
  room_rmid_uid: ["room", "{rmid}", "{uid}"],
  participantsOfRoom_rmid_uid: ["parrticipantsOfRoom", "{rmid}", "{uid}"],
  roomInvitations_uid: ["roomInvitations", "{uid}"],
  roomInvitationsCount_uid: ["roomInvitationsCount", "{uid}"],
  roomExists_ruid_uid: ["roomExists", "{ruid}", "{uid}"],
  reports_cnid: ["reports", "{cnid}"],
  reportedContents_type_tid: ["reportedContents", "{type}", "threads", "{tid}"],
  collaboratedShelvesOfUser_uid: ["collaboratedShelvesOfUser", "{uid}"],
  invitedShelvesOfUser_uid: ["invitedShelvesOfUser", "{uid}"],
  privateShelvesOfUser_uid: ["private-shelves-user-{uid}"],
  allShelvesOfUser_uid: ["all-shelves-user-{uid}"],
  shelfConnection_sid: ["shelfConnection", "{sid}"],
  shelfsForTaleon_cnid: ["shelfsForTaleon", "{cnid}"],
  ifReportExists_cnid_type: ["reportExists", "{cnid}", "{type}"],
  threadsOnTaleonOrArtist_id: ["threadsOnTaleonOrArtist", "{id}"],
  curatedPost_uid: ["curatedPosts", "{uid}"],
  trendingPosts: ["trendingPosts"],
};

export const cacheTags: Record<AvailableCacheTags, string[]> = {
  user_username: ["user-{username}"],
  currentUser_uid: ["currentUser-{uid}"],
  usernameAvailability_username: ["isUsernameAvailable-{username}"],
  userExistence_email: ["userExist-{email}"],
  connection_rid_uid: ["connection-requestedUser-{rid}-user-{uid}"],

  "saved-posts_uid": ["savedPosts-user-{uid}"],
  "saved-comments_uid": ["savedComments-user-{uid}"],
  "saved-shelfs_uid": ["savedShelves-user-{uid}"],
  isSaved_uid_id: ["isSaved-uid-{uid}-content-{id}"],

  notifications_uid: ["notifications-user-{uid}"],

  followersOfUser_uid: ["followers-user-{uid}"],
  followingOfUser_uid: ["following-user-{uid}"],
  blockedByUser_uid: ["blockedByUser-user-{uid}"],

  threadList_filter: ["threadList-filter-{filter}"],
  membersOfThread_tid: ["members-thread-{tid}"],
  joinedThreadsOfUser_uid: ["joinedThreads-user-{uid}"],
  createdThreadsOfUser_uid: ["createdThreads-user-{uid}"],
  threadsManageByUser_uid: ["threadsManageByUser-{uid}"],
  threadManagers_tid: ["managers-thread-{tid}"],
  member_tid_uid: ["member-thread-{tid}-user-{uid}"],
  thread_tid: ["thread-{tid}"],

  post_pid: ["post-{pid}"],
  postsOfUser_uid: ["posts-user-{uid}"],
  quotedPosts_pid: ["quotedPosts-post-{pid}"],
  postsOfThread_tid: ["posts-thread-{tid}"],
  reaction_pid_uid: ["reaction-post-{pid}-user-{uid}"],

  commentsOfPost_pid: ["comments-post-{pid}"],
  comment_cid: ["comment-{cid}"],
  commentsOfUser_uid: ["comments-user-{uid}"],
  replies_cid: ["replies-comment-{cid}"],
  like_cid_uid: ["likes-comment-{cid}-user-{uid}"],

  taleon_extid: ["taleon-{extid}"],

  popularShelves: ["popularShelves"],
  shelf_sid: ["shelf-{sid}"],
  shelvesOfUser_uid: ["shelves-user-{uid}"],
  privateShelvesOfUser_uid: ["private-shelves-user-{uid}"],
  allShelvesOfUser_uid: ["allShelves-user-{uid}"],
  shelvesForTaleon_tid_uid: ["shelvesForTaleon-{tid}-user-{uid}"],
  itemsOfShelf_sid: ["itemsOfShelf-{sid}"],
  shelfCollaborators_sid: ["shelf-collaborators-{sid}"],
  collaborativeShelvesOfUser_uid: ["collaborativeShelvesOfUser-{uid}"],
  invitedShelvesOfUser_uid: ["invitedShelvesOfUser-{uid}"],
  isShelfCollaborator_uid_sid: ["isShelfCollaborator-{uid}-{sid}"],

  roomInvitations_uid: ["roomInvitations-{uid}"],
  room_rmid_uid: ["room-{rmid}-user-{uid}"],

  reports_cnid: ["reports-{cnid}"],
  reportExists_cnid_uid: ["reportExists-{cnid}-{uid}"],
};

export const revalidateTags: Record<AvailableRevalidateTags, string[]> = {
  commentMutation_cid_uid_pid: [
    "comment-{cid}",
    "comments-user-{uid}",
    "comments-post-{pid}",
    "replies-comment-{cid}",
  ],
  commentUpdation_cid: ["comment-{cid}"],

  threadMembershipMutation_tid_uid: [
    "member-thread-{tid}-user-{uid}",
    "members-thread-{tid}",
    "joinedThreads-user-{uid}",
  ],

  notifications_uid: ["notifications-user-{uid}"],
  loginLogout_uid: ["currentUser-{uid}"],

  postMutation_pid_tid_uid: [
    "post-{pid}",
    "posts-thread-{tid}",
    "posts-user-{uid}",
    "thread-{tid}"
  ],
  postUpdation_pid: ["post-{pid}"],
  reactionMutation_pid_uid: ["reaction-post-{pid}-user-{uid}"],

  registration_email_username: [
    "userExist-{email}",
    "isUsernameAvailable-{username}",
    "user-{username}",
  ],

  threadMutation_tid_uid: ["thread-{tid}", "createdThreads-user-{user}"],
  likesMutation_cid_uid_author: [
    "likes-comment-{cid}-user-{uid}",
    "notifications-user-{author}",
  ],

  taleon_extid: ["taleon-{extid}"],

  shelfMutation_sid_uid: [
    "shelf-{sid}",
    "shelves-user-{uid}",
    "private-shelves-user-{uid}",
    "allShelves-user-{uid}"
  ],
  shelfUpdation_sid: ["shelf-{sid}"],
  shelfCollaboratorMutation_uid_sid: ["shelf-collaborators-{sid}", "invitedShelvesOfUser-{uid}", "collaborativeShelvesOfUser-{uid}", "shelf-{sid}", "isShelfCollaborator-{uid}-{sid}"],
  addItemsInShelf_sid: ["itemsOfShelf-{sid}", "shelf-{sid}"],

  savedPosts_uid: ["savedPosts-user-{uid}"],
  savedComments_uid: ["savedComments-user-{uid}"],
  savedShelves_uid: ["savedShelves-user-{uid}"],
  isSaved_uid_id: ["isSaved-uid-{uid}-content-{id}"],

  followUnfollow_rid_uid: [
    "connection-requestedUser-{rid}-user-{uid}",
    "followers-user-{uid}",
    "following-user-{rid}",
  ],
  blockUnblock_rid_uid: [
    "connection-requestedUser-{uid}-user-{rid}",
    "blockedByUser-user-{uid}"
  ],
  userMutation_uid_username: ["user-{username}", "currentUser-{uid}"],
  userUsernameMutation_uid_oldUsername_newUsername: [
    "user-{oldUsername}",
    "user-{newUsername}",
    "currentUser-{uid}",
    "isUsernameAvailable-{oldUsername}",
    "isUsernameAvailable-{newUsername}",
  ],
  userEmailMutation_uid_oldEmail_newEmail: [
    "userExist-{oldEmail}",
    "userExist-{newEmail}",
    "currentUser-{uid}",
  ],
  threadManagersMutation_tid_uid: [
    "managers-thread-{tid}",
    "thread-{tid}",
    "member-thread-{tid}-user-{uid}",
    "threadsManageByUser-{uid}"
  ],
  roomInvitations_uid: ["roomInvitations-{uid}"],
};

export const optimisedImageProps: Record<
  string,
  { width: number; height: number; alt: string;[key: string]: any }
> = {
  poster: {
    height: 128,
    width: 128,
    alt: "Poster",
    priority: true,
    className: "size-32 object-cover rounded-full",
  },
};

export const predefinedShelves: AllShelves[] = ["favourite", "recommended", "watched"];

export const allReasonsToReport: Record<UidsForReportReason, ReportReasonType> = {
  "sops": "Spam or Promoting Spam",
  "hot": "Harassment/Threatening",
  "hoa": "Hate/Abuse",
  "pomia": "Promoting or Mentioning illegal activities",
  "posi": "Promoting/Selling Items",
  "amohl": "Attached Malicious/Harmful Links",
  "popshos": "Promoting/Performing Self harm or Suicide",
  "sfi": "Spreading False Information",
  "mbfan": "Must be flagged as NSFW",
  "mbfas": "Must be flagged as Spoiler",
  "maos": "Minor Abuse or Sexualization",
  "ipc": "Inappropriate Content",
  "ioptbse": "Impersonation/Pretending to be someone else",
  "nla": "No Longer Active",
  "sof": "Scam or Fraud",
  "uau": "Under-age User",
  "dplt": "Duplicate Thread",
  "others": "Others",
}

const commonReportOptions: UidsForReportReason[] = [
  "sops", "hot", "hoa", "pomia", "posi", "amohl", "popshos", "sfi"
];

export const contentReportOptions: UidsForReportReason[] = [
  ...commonReportOptions,
  "mbfan", "mbfas", "maos", "ipc", "others"
];

export const userReportOptions: UidsForReportReason[] = [
  ...commonReportOptions,
  "ioptbse", "nla", "sof", "uau", "others"
];

export const threadReportOptions: UidsForReportReason[] = [
  ...commonReportOptions,
  "mbfan", "dplt", "others"
];


// For ParloId - Unique ids used to identify Sharable Content
export const lengthForShortParloId = 10;
export const lengthForAvgParloId = 16;
export const lengthForLongParloId = 21;

// Pages Enum 
export const pagesEnumForBugOrSuggestion = [
  "home",
  "explore",
  "movies",
  "shows",
  "artists",
  "thread",
  "shelf",
  "comment",
  "post",
  "profile",
  "chats",
  "settings",
  "notifications"
]