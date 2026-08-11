import { getCacheTags, getTimeInFuture } from "@lib/shared/utils";

import {
  AggregatedResponse,
  CurrentUser,
  FullComment,
  FullPost,
  FullRoomType,
  FullShelf,
  FullTaleonType,
  GeneralGetReturn,
  MereComment,
  MereMessage,
  MerePost,
  MereRoomType,
  MereShelf,
  MereThread,
  MereUser,
  ReportedContentEnum,
  ReportsType,
  RequestedUser,
  SearchedRoom,
  ShelfCollaborators,
  ShelfItemType,
  ShelvesForTaleon,
  Thread,
  ThreadModType
} from "@type/internal";

import { CollaboratorModelType, MembershipModelType, NotificationModelType, ReportModelType } from "@type/models";
import { AvailableCacheTags, CookiesType, PPGetDataProps } from "@type/other";
import { oneDayInMiliSeconds, oneDayInSeconds, oneHourInSeconds, oneMinInSeconds, parloculaAppURL, queryFilters } from "../constants";
import { createUpdateTaleon } from "../../frontend/helpers/mutations";

export const ppGetData = async <T, K extends AvailableCacheTags = any>(
  { url, revalidate, tag, options, cookies, searchParams }: PPGetDataProps<K>
): Promise<GeneralGetReturn<T>> => {

  const cacheTags = tag && options ? getCacheTags(tag, options) : undefined;
  const jar = cookies?.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

  const urlToFetch = new URL(url, `${parloculaAppURL}/api/v1/`);

  Object.entries(searchParams ?? {}).forEach(([k, v]) => {
    if (v !== undefined) urlToFetch.searchParams.set(k, String(v));
  });

  try {

    return await fetch(urlToFetch.href, {
      next: { revalidate: revalidate ?? 0, tags: cacheTags },
      cache: revalidate ? "force-cache" : "no-cache",
      headers: jar ? { Cookie: jar } : undefined,
    }).then((res) => res.json());

  } catch (err: any) {

    console.error(`Error occured at path ${url} `, err.message);

    return { success: false, errCode: "unstable_internet" };
  }
};

export const getCurrentUser = async (id: string, cookies?: CookiesType) =>
  await ppGetData<CurrentUser>({
    url: `private/${id}/user`,
    revalidate: oneHourInSeconds,
    tag: "currentUser_uid",
    options: { uid: id },
    cookies,
  });

export const getTrendingPosts = async (p: number, nsfw: boolean) =>
  await ppGetData<AggregatedResponse<MerePost & { score: number }>>({
    url: "post/trending",
    revalidate: 500,
    searchParams: { p, nsfw }
  })

export const getUserFeed = async (cuid: string, page: number, nsfw: boolean, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MerePost & { score: number }>>({
    url: `private/${cuid}/feed`,
    revalidate: 500,
    searchParams: { p: page, nsfw },
    cookies,
  })

export const isUsernameAvailable = async (username: string) =>
  await ppGetData<MerePost & { score: number }>({
    url: "user/isUsernameAvailable",
    searchParams: { username },
    revalidate: oneDayInSeconds * 7,
    tag: "usernameAvailability_username",
    options: { username },
  });

export const checkIfUserExist = async (email: string) => await ppGetData({
  url: "user/ifUserExist",
  searchParams: { email },
  revalidate: oneDayInSeconds * 7,
  tag: "userExistence_email",
  options: { email },
});

export const getThreadById = async (id: string) => await ppGetData<Thread>({
  url: `thread/${id}`,
  revalidate: oneHourInSeconds * 3,
  tag: "thread_tid",
  options: { tid: id },
});

export const getThreads = async (page: number, nsfw: boolean, filter = queryFilters.threads[0]) =>
  await ppGetData<AggregatedResponse<MereThread>>({
    url: "thread",
    searchParams: { f: filter, p: page, nsfw },
    revalidate: oneHourInSeconds,
    tag: "threadList_filter",
    options: { filter: filter },
  });

export const getMembers = async (tid: string, page: number) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `thread/${tid}/members`,
    searchParams: { p: page },
    revalidate: oneHourInSeconds * 3,
    tag: "membersOfThread_tid",
    options: { tid },
  });

export const isMember = async (
  tid: string,
  uid: string,
  cookies?: CookiesType
): Promise<GeneralGetReturn<MembershipModelType>> => {
  if (!uid) return { success: false, errCode: "unauthenticated_access" };
  return await ppGetData({
    url: `private/${uid}/thread/${tid}/member`,
    revalidate: oneDayInSeconds * 3,
    tag: "member_tid_uid",
    options: { tid, uid },
    cookies,
  });
};

export const searchMembers = async (tid: string, query: string, page: number) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `search/members/${tid}`,
    searchParams: { p: page, q: query }
  });

export const joinedThreadsOfUser = async (
  uid: string,
  page = 1,
  cookies?: CookiesType,
) =>
  await ppGetData<AggregatedResponse<MereThread>>({
    url: `private/${uid}/thread/user/joined`,
    searchParams: { p: page },
    revalidate: oneHourInSeconds,
    tag: "joinedThreadsOfUser_uid",
    options: { uid },
    cookies,
  });

export const createdThreadsOfUser = async (uid: string, page = 1, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MereThread>>({
    url: `private/${uid}/thread/user/created`,
    searchParams: { p: page },
    revalidate: oneDayInSeconds,
    tag: "createdThreadsOfUser_uid",
    options: { uid },
    cookies,
  });

export const threadsManageByUser = async (uid: string, page = 1, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MereThread>>({
    url: `private/${uid}/thread/user/manages`,
    searchParams: { p: page },
    revalidate: oneDayInSeconds,
    tag: "threadsManageByUser_uid",
    options: { uid },
    cookies,
  });

export const getPostsOfThread = async (
  tid: string,
  page: number,
  nsfw: boolean,
  filter = queryFilters.posts[0],
  type: "posts" | "frames" | "links",
  category = "",
) =>
  await ppGetData<AggregatedResponse<MerePost>>({
    url: `post/thread/${tid}`,
    searchParams: {
      p: page,
      f: filter,
      c: category,
      t: type,
      nsfw,
    },
    revalidate: oneHourInSeconds,
    tag: "postsOfThread_tid",
    options: { tid },
  });

export const getPostsOfUser = async (
  uid: string,
  page: number,
  nsfw: boolean,
  filter = queryFilters.posts[0]
) =>
  await ppGetData<AggregatedResponse<MerePost>>({
    url: `post/user/${uid}`,
    searchParams: { p: page, f: filter, nsfw },
    revalidate: oneHourInSeconds * 3,
    tag: "postsOfUser_uid",
    options: { uid },
  });

export const getReactionOnPost = async (pid: string, uid: string, cookies?: CookiesType) =>
  await ppGetData({
    url: `private/${uid}/post/${pid}/reaction`,
    revalidate: oneDayInSeconds * 3,
    tag: "reaction_pid_uid",
    options: { pid, uid },
    cookies,
  });

export const getCommentsOfUser = async (
  uid: string,
  page: number,
  nsfw: boolean,
  filter = queryFilters.comments[0],
) =>
  await ppGetData<AggregatedResponse<MereComment>>({
    url: `comment/user/${uid}`,
    searchParams: { p: page, f: filter, nsfw },
    revalidate: oneHourInSeconds * 3,
    tag: "commentsOfUser_uid",
    options: { uid },
  });

export const getPopularShelves = async (p: number) => await ppGetData<AggregatedResponse<MereShelf>>({
  url: "shelf",
  searchParams: { p },
  revalidate: oneDayInSeconds,
  tag: "popularShelves",
  options: {},
})

export const getShelvesOfUser = async (
  uid: string,
  page: number,
  filter = queryFilters.shelves[0]
) =>
  await ppGetData<AggregatedResponse<MereShelf>>({
    url: `shelf/${uid}`,
    searchParams: { p: page, f: filter },
    revalidate: oneHourInSeconds,
    tag: "shelvesOfUser_uid",
    options: { uid },
  });

export const getPrivateShelvesOfUser = async (
  uid: string,
  page: number,
  cookies?: CookiesType,
) =>
  await ppGetData<AggregatedResponse<MereShelf>>({
    url: `private/${uid}/shelf`,
    searchParams: { p: page },
    revalidate: oneHourInSeconds * 3,
    tag: "privateShelvesOfUser_uid",
    options: { uid },
    cookies,
  });

export const getAllShelvesOfUser = async (
  uid: string,
  page: number,
  cookies?: CookiesType,
) =>
  await ppGetData<AggregatedResponse<MereShelf>>({
    url: `private/${uid}/shelf/all`,
    searchParams: { p: page },
    revalidate: oneHourInSeconds,
    tag: "allShelvesOfUser_uid",
    options: { uid },
    cookies,
  });

export const getShelvesAsCollaborator = async (uid: string, page: number, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MereShelf>>({
    url: `private/${uid}/shelf/collaborative`,
    searchParams: { p: page },
    revalidate: oneDayInSeconds,
    tag: "collaborativeShelvesOfUser_uid",
    options: { uid },
    cookies
  });

export const getShelvesAsInvitee = async (uid: string, page: number) =>
  await ppGetData<AggregatedResponse<MereShelf>>({
    url: `private/${uid}/shelf/invited`,
    searchParams: { p: page },
    revalidate: oneDayInSeconds,
    tag: "invitedShelvesOfUser_uid",
    options: { uid },
  });

export const getPostById = async (id: string) =>
  await ppGetData<FullPost>({
    url: `post/${id}`,
    revalidate: oneDayInSeconds,
    tag: "post_pid",
    options: { pid: id },
  });

export const getQuotesOfPost = async (id: string, page = 1, nsfw: boolean) =>
  await ppGetData<AggregatedResponse<MerePost>>({
    url: `post/${id}/quotes`,
    searchParams: { p: page, nsfw },
    revalidate: oneHourInSeconds * 3,
    tag: "quotedPosts_pid",
    options: { pid: id },
  });

export const getCommentsOnPost = async (
  id: string,
  page: number,
  filter = queryFilters.comments[0],
  nsfw: boolean,
) =>
  await ppGetData<AggregatedResponse<MereComment>>({
    url: `comment/post/${id}`,
    searchParams: { p: page, f: filter, nsfw },
    revalidate: oneHourInSeconds * 3,
    tag: "commentsOfPost_pid",
    options: { pid: id },
  });

export const getCommentById = async (id: string) =>
  await ppGetData<FullComment>({
    url: `comment/${id}`,
    revalidate: oneDayInSeconds,
    tag: "comment_cid",
    options: { cid: id },
  });

export const checkLikeOnComment = async (cid: string, uid: string, cookies?: CookiesType) =>
  await ppGetData({
    url: `private/${uid}/comment/${cid}/like`,
    revalidate: oneDayInSeconds * 3,
    tag: "like_cid_uid",
    options: { cid, uid },
    cookies,
  });

export const getRepliesOnComment = async (
  id: string,
  page: number,
  filter = queryFilters.comments[0],
  nsfw: boolean,
) =>
  await ppGetData<AggregatedResponse<MereComment>>({
    url: `comment/${id}/replies`,
    searchParams: { p: page, f: filter, nsfw },
    revalidate: oneHourInSeconds,
    tag: "replies_cid",
    options: { cid: id },
  });

export const getThreadsForTaleonOrArtist = async (
  id: string,
  page: number,
  nsfw: boolean,
  filter = queryFilters.threads[0],
) =>
  await ppGetData<AggregatedResponse<MereThread>>({
    url: `thread/taleon/${id}`,
    searchParams: { p: page, f: filter, nsfw },
    revalidate: oneHourInSeconds,
  });

export const getUserByUsername = async (username: string) =>
  await ppGetData<RequestedUser>({
    url: `user/${username}`,
    revalidate: oneDayInSeconds,
    tag: "user_username",
    options: { username },
  });

export const getFollowers = async (uid: string, page = 1, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/user/followers`,
    searchParams: { p: page },
    revalidate: oneHourInSeconds * 3,
    tag: "followersOfUser_uid",
    options: { uid },
    cookies,
  });

export const getFollowing = async (uid: string, page = 1, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/user/following`,
    searchParams: { p: page },
    revalidate: oneHourInSeconds * 3,
    tag: "followingOfUser_uid",
    options: { uid },
    cookies,
  });

export const getBlockedUsers = async (uid: string, page = 1, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/user/blocked`,
    searchParams: { p: page },
    revalidate: oneHourInSeconds * 3,
    tag: "blockedByUser_uid",
    options: { uid },
    cookies,
  });

export const getTaleon = async (ext_id: string, type: "movie" | "show"): Promise<FullTaleonType | null> => {
  if (!ext_id) return null;

  const id = ext_id.split("-")[0];

  const item = await ppGetData<FullTaleonType>({
    url: `taleon/${id}`,
    revalidate: oneDayInSeconds * 3,
    tag: "taleon_extid",
    options: { extid: id },
  });

  if (item.success) {
    // Updating taleon after 5 days of editing
    // If editedAt + 5 Days is less than now that means the taleon is updated more than 5 days ago
    if (getTimeInFuture({ unit: "d", timeVal: 5, from: item.result.editedAt }) < Date.now())
      createUpdateTaleon(ext_id, type, true);

    return { ...item.result, taleon_id: item.result._id };
  }

  else if (item.errCode == "resource_not_found") {
    return await createUpdateTaleon(ext_id, type, false);
  }

  return null;
};

export const getShelvesForTaleon = async (id: string, uid: string, cookies?: CookiesType) =>
  await ppGetData<ShelvesForTaleon>({
    url: `private/${uid}/taleon/${id}`,
    tag: "shelvesForTaleon_tid_uid",
    options: { tid: id, uid },
    revalidate: oneHourInSeconds,
    cookies,
  });

export const getShelf = async (
  id: string,
  uid: string | undefined,
  key: string = 'none',
  cookies?: CookiesType,
): Promise<GeneralGetReturn<FullShelf>> => {
  const { success, errCode, result } = await ppGetData<FullShelf>({
    url: `private/${uid}/shelf/${id}`,
    searchParams: { k: key },
    revalidate: oneDayInSeconds,
    tag: "shelf_sid",
    options: { sid: id },
    cookies
  });

  if (!success || !result)
    return { success, errCode, result };

  if (result.isPrivate) {
    if (!uid) return { success: false, errCode: "unauthenticated_access" };
    else if (
      !(
        result.user_id === uid ||
        result.shelfKey === key ||
        result.collaborators?.find((u) => u === uid)
      )
    )
      return { success: false, errCode: "unauthorized_access" };
  }
  return { success, result };
};

export const getShelfConnection = async (uid: string, sid: string, cookies?: CookiesType) =>
  await ppGetData<Required<CollaboratorModelType>>({
    url: `private/${uid}/shelf/${sid}/isCollaborator`,
    revalidate: oneDayInSeconds * 3,
    tag: "isShelfCollaborator_uid_sid",
    options: { sid, uid },
    cookies,
  })

export const getCollaboratorsOfShelf = async (uid: string, sid: string, cookies: CookiesType) =>
  await ppGetData<ShelfCollaborators>({
    url: `private/${uid}/shelf/${sid}/collaborators`,
    cookies,
    revalidate: oneDayInSeconds * 3,
    tag: "shelfCollaborators_sid",
    options: { sid },
  });

export const getItems = async (
  id: string,
  uid: string | undefined,
  page: number,
  filter = queryFilters.items[0],
  key = "none",
  cookies?: CookiesType,
) => await ppGetData<AggregatedResponse<ShelfItemType>>({
  url: `private/${uid}/item/${id}`,
  searchParams: { k: key, f: filter, p: page },
  revalidate: oneHourInSeconds,
  tag: "itemsOfShelf_sid",
  options: { sid: id },
  cookies,
});

export const searchPosts = async (query: string, nsfw: boolean, page = 1) =>
  await ppGetData<AggregatedResponse<MerePost>>({
    url: "search/posts",
    revalidate: oneMinInSeconds * 5,
    searchParams: { q: query, nsfw, p: page },
  });

export const searchComments = async (query: string, nsfw: boolean, page = 1) =>
  await ppGetData<AggregatedResponse<MereComment>>({
    url: "search/comments",
    searchParams: { q: query, nsfw, p: page },
  });

export const searchThreads = async (query: string, nsfw: boolean, page = 1) =>
  await ppGetData<AggregatedResponse<MereThread>>({
    url: "search/threads",
    revalidate: oneMinInSeconds * 5,
    searchParams: { q: query, nsfw, p: page },
  });

export const searchUsers = async (query: string, page = 1) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: "search/users",
    revalidate: oneMinInSeconds * 5,
    searchParams: { q: query, p: page }
  });

export const searchShelves = async (query: string, page = 1) =>
  await ppGetData<AggregatedResponse<MereShelf>>({
    url: "search/shelves",
    revalidate: oneMinInSeconds * 5,
    searchParams: { q: query, p: page }
  })

export const searchFollowers = async (q: string, uid: string, p = 1) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/search/followers`,
    revalidate: oneMinInSeconds * 5,
    searchParams: { q, p }
  });

export const searchBlockedUsers = async (q: string, uid: string, p = 1) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/search/blocked`,
    revalidate: oneMinInSeconds * 5,
    searchParams: { q, p }
  });

export const searchFollowing = async (q: string, uid: string, p = 1) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/search/following`,
    revalidate: oneMinInSeconds * 5,
    searchParams: { q, p }
  });

export const searchBannedMembers = async (tid: string, uid: string, q: string, p = 1) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/search/banned/${tid}`,
    revalidate: oneMinInSeconds * 5,
    searchParams: { q, p }
  });

export const checkIfItemSaved = async (
  id: string,
  uid: string,
  cookies?: CookiesType
) =>
  await ppGetData({
    url: `private/${uid}/bookmark/${id}`,
    revalidate: oneDayInSeconds * 3,
    tag: "isSaved_uid_id",
    options: { uid, id },
    cookies,
  });

export const getSavedContent = async (
  uid: string,
  type: "comment" | "shelf" | "post",
  page = 1,
  cookies?: CookiesType
) =>
  await ppGetData<AggregatedResponse>({
    url: `private/${uid}/bookmark/${type}`,
    searchParams: { p: page },
    revalidate: oneDayInSeconds,
    tag: `saved-${type}s_uid`,
    options: { uid },
    cookies,
  });

export const checkUserConnection = async (
  uid: string,
  rid: string,
  cookies?: CookiesType
): Promise<GeneralGetReturn> =>
  await ppGetData({
    url: `private/${uid}/user/${rid}/follow`,
    revalidate: oneDayInSeconds * 2,
    tag: "connection_rid_uid",
    options: { uid, rid },
    cookies,
  });

export const getNotificationsOfUser = async (
  uid: string,
  page: number,
  cookies?: CookiesType
) =>
  await ppGetData<AggregatedResponse<NotificationModelType>>({
    url: `private/${uid}/notification`,
    searchParams: { p: page },
    revalidate: oneHourInSeconds,
    tag: "notifications_uid",
    options: { uid },
    cookies,
  });

export const getBannedMembers = async (tid: string, uid: string, p = 1, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/thread/${tid}/banned`,
    searchParams: { p },
    cookies,
  });

export const getManagers = async (tid: string, uid: string, cookies?: CookiesType) =>
  await ppGetData<ThreadModType>({
    url: `private/${uid}/thread/${tid}/managers`,
    tag: "threadManagers_tid",
    options: { tid },
    revalidate: oneDayInSeconds * 3,
    cookies,
  });

export const getRooms = async (uid: string, page = 1, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<MereRoomType>>({
    url: `private/${uid}/room`,
    searchParams: { p: page },
    cookies,
  });

export const getInvitedRoomsCount = async (uid: string, cookies?: CookiesType) =>
  await ppGetData<number>({
    url: `private/${uid}/room/invitation/count`,
    cookies,
  });

export const getInvitedRooms = async (
  uid: string,
  page = 1,
  cookies?: CookiesType
) =>
  await ppGetData<AggregatedResponse<MereRoomType>>({
    url: `private/${uid}/room/invitation`,
    searchParams: { p: page },
    cookies,
  });

export const getRoomById = async (
  uid: string,
  rmid: string,
  cookies?: CookiesType
) =>
  await ppGetData<FullRoomType>({
    url: `private/${uid}/room/${rmid}`,
    cookies,
  });

export const getParticipantsOfRoom = async (
  uid: string,
  rmid: string,
  page = 1,
  cookies?: CookiesType
) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/room/${rmid}/participant`,
    searchParams: { p: page },
    cookies,
  });

export const getRoomByUserId = async (
  uid: string,
  ruid: string,
  cookies?: CookiesType
) =>
  await ppGetData<FullRoomType>({
    url: `private/${uid}/room/user/${ruid}`,
    cookies,
  });

export const getMessages = async (
  uid: string,
  rmid: string,
  page = 1,
  cookies?: CookiesType
) =>
  await ppGetData<AggregatedResponse<MereMessage>>({
    url: `private/${uid}/room/${rmid}/message`,
    searchParams: { p: page },
    cookies,
  });

export const getUserMeta = async (uid: string) =>
  await ppGetData<MereUser>({ url: `user/meta/${uid}` });


export const checkIfReportExists = async (cnid: string, uid: string, type: ReportedContentEnum, cookies?: CookiesType) =>
  await ppGetData<ReportModelType>({
    url: `private/${uid}/report/${cnid}`,
    searchParams: { t: type },
    cookies,
    revalidate: oneDayInSeconds * 3
  });

export const getReportsOnContent = async (uid: string, cnid: string, type: ReportedContentEnum, page: number, reason?: string, cookies?: CookiesType) =>
  await ppGetData<AggregatedResponse<{ details: string }>>({
    url: `private/${uid}/report/${cnid}/details`,
    searchParams: { t: type, p: page, reason },
    revalidate: oneDayInSeconds,
    tag: "reports_cnid",
    options: { cnid },
    cookies,
  });

export const getReportReasonToCountMap = async (uid: string, cnid: string, type: ReportedContentEnum, cookies?: CookiesType) =>
  await ppGetData<{ reports: ReportsType[] }>({
    url: `private/${uid}/report/${cnid}/count`,
    searchParams: { t: type },
    revalidate: oneDayInSeconds,
    tag: "reports_cnid",
    options: { cnid },
    cookies,
  });

export const getReportedContents = async (tid: string, uid: string, type: "post" | "comment", page = 1) =>
  await ppGetData<AggregatedResponse<ReportsType>>({
    url: `private/${uid}/report/${tid}/${type}s`,
    searchParams: { p: page },
    revalidate: oneMinInSeconds * 5
  });

export const searchRooms = async (uid: string, query: string, page = 1) =>
  await ppGetData<AggregatedResponse<SearchedRoom>>({
    url: `private/${uid}/search/rooms`,
    searchParams: { q: query, p: page },
    revalidate: oneMinInSeconds * 5,
  });

export const searchNonBlockedUsers = async (uid: string, query: string, page = 1) =>
  await ppGetData<AggregatedResponse<MereUser>>({
    url: `private/${uid}/search/users`,
    searchParams: { q: query, p: page },
    revalidate: oneMinInSeconds * 5,
  });