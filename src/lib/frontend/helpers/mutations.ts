import LinkToast from "@components/toasts/LinkToast";
import { getQueryClient } from "@lib/backend/providers/queryClient";
import generateFingerprint from "@lib/frontend/auth/fingerprint";
import appToast from "@lib/frontend/providers/appToast";
import { oneDayInSeconds, parloculaAppURL, queryFilters } from "@lib/shared/constants";
import { codetoError, getQueryKeys, parloId, trycatch } from "@lib/shared/utils";
import { objectToFormData } from "@lib/frontend/utils";
import { offlineStore } from "@store/offlineStore";
import useRoomStore from "@store/roomStore";
import useCurrentUser from "@store/user";
import { GeneralExtReturn, RefinedMovieData, RefinedShowData } from "@type/external";
import { CommentReplyType, CurrentUser, FullComment, FullPost, FullRoomType, FullShelf, FullTaleonType, GeneralGetReturn, GeneralPostReturn, MereComment, MereMessage, MereRoomType, MereShelf, MereUser, ModeratorType, ShelfCollaborator, ShelfCollaborators, ShelfItemType, ShelvesForTaleon, ThreadModType, UserConnectionType } from "@type/internal";
import { CollaboratorModelType, MembershipModelType, NotificationModelType } from "@type/models";
import { AppRouterInstance } from "@type/nextjs";
import { ErrorCodes, InfiniteScrollerDataType } from "@type/other";
import { BookmarkSchemaType, CommentSchemaType, CommentSchemaUpdateType, EmailUpdateSchemaType, ItemsForShelfSchemaType, LikeSchemaType, MessageSchemaType, PostSchemaType, PostUpdateSchemaType, ReportActionSchemaType, ReportSchemaType, ReportTypeEnum, RoomSchemaType, SessionInvalidationServerSchemaType, SharedContentSchemaType, ShelfEditSchemaType, ShelfSchemaType, TaleonToAddAndRemoveType, ThreadSchemaServer, ThreadUpdateSchema, UsernameUpdateSchemaType, UserSchemaType, UserUpdateSchemaType } from "@type/schemas";
import axios from "axios";
import { ZodIssue } from "zod";
import { setUserOnRefreshOrLogin } from "./user";

type MutationFunction<R> = () => Promise<GeneralPostReturn<R>>

type PerformMutationProps<R, M = undefined> = {
    mutationFn: MutationFunction<R>,
    onMutate?: () => Promise<M> | M | undefined,
    beforeMutation?: () => void,
    onSuccess?: (options: { context: M | undefined, data: R }) => void,
    onError?: (options: { error: string, context: M | undefined }) => void,
    onSettle?: () => void;
    codeToReturn?: ErrorCodes;
}

export const ppPostData = async <T,>({
    url,
    data,
    uid,
}: {
    url: string;
    data?: any;
    uid: string;
}): Promise<GeneralPostReturn<T>> => {
    if (!uid) return { success: false, errCode: "unauthenticated_access" };
    return await trycatch(() =>
        axios
            .post(
                `/api/v1/private/${uid}/${url}`,
                data ? objectToFormData(data):undefined,
            )
            .then((r) => r.data)
    );
};

export const ppUpdateData = async ({
    url,
    data,
    uid,
}: {
    url: string;
    data?: any;
    uid: string;
}): Promise<GeneralPostReturn> => {
    return await trycatch(() =>
        axios
            .patch(
                `/api/v1/private/${uid}/${url}`,
                objectToFormData(data)
            )
            .then((r) => r.data)
    );
};

export const ppDeleteData = async (
    url: string,
    uid: string
): Promise<GeneralGetReturn> => {
    return await trycatch(() =>
        axios
            .delete(`${parloculaAppURL}/api/v1/private/${uid}/${url}`)
            .then((res) => res.data)
    );
};

export const handleErrorFromMutation = (data: GeneralPostReturn) => {
    const { customError, errCode, formError } = data;
    if (data.success || !errCode) return;
    else if (formError) return formError;
    else if (customError) appToast.error(customError);
    else appToast.error(codetoError(errCode));
    return undefined;
}

const unstableInternetError = () => {
    const errMsg = "Unstable Internet connection! Please check your connection and try again."
    appToast.error(errMsg);
    return errMsg;
}

type PerformMutationReturn = {
    success: true, result: any, error?: unknown;
} | {
    success: false, error: string | ZodIssue[] | undefined; result?: unknown
}

const performMutation = async <T, M = undefined>({ mutationFn, onError, beforeMutation, onSettle, onMutate, onSuccess, codeToReturn }: PerformMutationProps<T, M>): Promise<PerformMutationReturn> => {
    if (navigator && !navigator.onLine) {
        appToast.error(unstableInternetError());
        return { success: false, error: undefined }
    }

    const context = await onMutate?.();

    try {
        beforeMutation?.();
        const response = await mutationFn();

        if (response.success) {
            onSuccess?.({ context, data: response.result });
            return { success: true, result: response.result }
        }

        else {
            console.log("context", context);
            onError?.({ error: response.errCode, context });
            if (codeToReturn && response.errCode === codeToReturn)
                return { success: false, error: response.errCode };

            return { success: false, error: handleErrorFromMutation(response) };
        }
    } catch (err: any) {
        console.warn("Error occured while performing mutation:", err.message);

        onError?.({ error: "uncaught_error", context });
        if (codeToReturn && codeToReturn === "uncaught_error")
            return { success: false, error: "uncaught_error" };

        return { success: false, error: unstableInternetError() };
    } finally {
        onSettle?.();
    }
}

// Optimistic Mutation Helper
type Matcher<T> = (result: T) => boolean;

export const addDocsInInfiniteQueryResult = <T = unknown>(queryKeys: string[], data: T) => {

    const queryClient = getQueryClient();

    const arrToAdd = Array.isArray(data) ? data : [data];

    const previousState = queryClient.getQueryData<InfiniteScrollerDataType<T>>(queryKeys);

    queryClient.setQueryData(queryKeys, (old: InfiniteScrollerDataType<T>) => {
        const oldData = old ?? {
            pageParams: [1],
            pages: [{ results: [], page: 1, total_pages: 1, total_results: 0 }],
        };

        const { pages } = oldData;
        const [firstPage, ...restPages] = pages;

        const { total_results, results, ...rest } = firstPage;

        const newPages = [
            {
                results: [...arrToAdd, ...results],
                total_results: total_results + 1,
                ...rest,
            },
            ...restPages,
        ];

        return { ...oldData, pages: newPages };
    });

    return previousState;
};

export const updateDocInInfiniteQueryResult = <T>(queryKeys: string[], matcher: Matcher<T>, data: Partial<T>) => {

    const queryClient = getQueryClient();

    const previousState = queryClient.getQueryData(queryKeys);

    queryClient.setQueryData<InfiniteScrollerDataType<T>>(queryKeys, (old) => {

        if (!old) return old;

        const { pages } = old;

        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            const page = pages[pageIndex];
            const docIndex = page.results.findIndex(matcher);

            if (docIndex !== -1) {
                // ✅ Rebuild only the affected page & document
                const newPage = {
                    ...page,
                    results: [
                        ...page.results.slice(0, docIndex),
                        { ...page.results[docIndex], ...data },
                        ...page.results.slice(docIndex + 1),
                    ],
                };

                const newPages = [
                    ...pages.slice(0, pageIndex),
                    newPage,
                    ...pages.slice(pageIndex + 1),
                ];

                return { ...old, pages: newPages };
            }
        }

        return old;
    });

    return previousState;
}

export const updateDoc = <T extends Record<string, any>>(
    qkey: (string | number)[],
    update: Partial<T> | ((prev: T | undefined) => T | undefined),
) => {
    const queryClient = getQueryClient();

    const prev = queryClient.getQueryData<T>(qkey);

    if (typeof update === "function") {
        queryClient.setQueryData(qkey, update);
    } else {
        queryClient.setQueryData(qkey, (prev: Record<string, unknown>) => {
            if (!prev) return prev;
            return { ...prev, ...update };
        });
    }

    return prev;
};

export const setDoc = <T = unknown>(qkey: string[], data: T) => {
    const queryClient = getQueryClient();

    const prev = queryClient.getQueryData<T>(qkey);

    queryClient.setQueryData(qkey, data);

    return prev;
}

export const filterDocsInInfiniteQueryResult = <T extends Record<string, any>>(qkeys: string[], ids: string[], matcher?: Matcher<T>) => {

    const queryClient = getQueryClient();

    const previousState = queryClient.getQueryData(qkeys);
    const idMap = new Map<string, boolean>(ids.map((id) => [id, true]));

    const filterFunction: Matcher<T> = matcher ?? ((result: T) => !idMap.get(result._id));

    updateDoc<InfiniteScrollerDataType<T>>(qkeys, (oldData) => {
        if (!oldData) return;

        return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
                ...page,
                results: page.results.filter(filterFunction),
            })),
        };
    });

    return previousState;
};

export const refetchQueries = (queryKeys: string[] | string[][]) => {
    const queryClient = getQueryClient();

    const queriesToRefetch = Array.isArray(queryKeys[0]) ?
        queryKeys as string[][]
        : [queryKeys as string[]];

    queriesToRefetch.forEach(query => {
        queryClient.refetchQueries({ queryKey: query });
    })
}

export const deleteQueires = (queryKeys: string[] | string[][]) => {
    const queryClient = getQueryClient();

    const queriesToRefetch = Array.isArray(queryKeys[0]) ?
        queryKeys as string[][]
        : [queryKeys as string[]];

    queriesToRefetch.forEach(query => {
        queryClient.removeQueries({ queryKey: query });
    })
}

// Mutation Functions

export const registerUserMutation = async (data: UserSchemaType) => {
    return performMutation({
        mutationFn: () => axios
            .post<GeneralPostReturn>(
                `${parloculaAppURL}/api/v1/user/register`,
                objectToFormData(data)
            )
            .then((r) => r.data)
            .catch(r => r.response.data),
        onSuccess: ({ data }: { data: CurrentUser }) => {

            setUserOnRefreshOrLogin(data, Boolean(data.filterContent));

            getQueryClient().setQueryData(
                getQueryKeys("user_username", { username: data.username }),
                data
            );
        }
    });

};

export const loginUserMutation = async (data: { email: string, code: number }) => {

    const fingerprint = await generateFingerprint();

    return performMutation({
        mutationFn: () => axios
            .post<GeneralPostReturn>(`${parloculaAppURL}/api/v1/user/login`,
                objectToFormData({ ...data, fingerprint })
            )
            .then((r) => r.data)
            .catch(r => r.response.data),

        onSuccess: ({ data }: { data: CurrentUser }) => {
            setUserOnRefreshOrLogin(data, Boolean(data.filterContent));

            getQueryClient().setQueryData(
                getQueryKeys("user_username", { username: data.username }),
                data
            );
        },
        codeToReturn: "unregistered_user",
    });

};

export const createUpdateTaleon = async (ext_id: string, type: "movie" | "show", update: boolean): Promise<FullTaleonType | null> => {

    const data: GeneralExtReturn<RefinedShowData | RefinedMovieData> = await fetch(
        `https://testlalaapp.vercel.app/api/${type}?id=${ext_id}`,
        { next: { revalidate: oneDayInSeconds * 3 } }
    ).then((r) => r.json());

    if (!data.status) return null;

    const { title, year, poster } = data.response;

    const dataToPost = {
        title: title,
        poster: poster || "",
        year,
        taleon_type: type,
        ext_id,
    };

    if (update) {

        const resp = await axios
            .patch(`${parloculaAppURL}/api/v1/taleon/${ext_id}`, objectToFormData(dataToPost))
            .then((r) => r.data)
            .catch(r => r.response.data);

        const { result } = resp;

        return result;
    }

    const resp = await axios
        .post(`${parloculaAppURL}/api/v1/taleon/${ext_id}`, objectToFormData(dataToPost))
        .then((r) => r.data)
        .catch(r => r.response.data);

    const { result } = resp;

    return result;
}

export const createCommentMutation = async (comment: CommentSchemaType & { parent: CommentReplyType | undefined }, section: "replies" | "comments", filter: string | null) => {

    const meta = useCurrentUser.getState().meta;

    if (!meta || (section === "replies" && !comment.replied_to))
        return { success: false, error: undefined };

    const { parent, ...restOfComment } = comment;

    const filterForComments = queryFilters["comments"];
    const chosenFilter = filter && filterForComments.some(f => f === filter) ? filter : filterForComments[0];

    const queryClient = getQueryClient();

    const commentsKey = getQueryKeys("commentsOfPost_pid_filter", { pid: comment.post_id, filter: chosenFilter });
    const repliesKey = getQueryKeys("replies_cid_filter", { cid: comment.replied_to || "", filter: chosenFilter });

    const keyToOptimisticallyUpdate = section === "replies" ? repliesKey : commentsKey;

    const queryKeysToRefetch = [
        getQueryKeys("commentsOfUser_uid_filter", { uid: meta.user_id, filter: "latest" }),
        (section === "replies" ? commentsKey : repliesKey),
        ...filterForComments
            .filter(f => f !== filter)
            .map(f => getQueryKeys("commentsOfPost_pid_filter", { pid: comment.post_id, filter: f })),
        ...filterForComments
            .filter(f => f !== filter)
            .map(f => getQueryKeys("replies_cid_filter", { cid: comment.replied_to || "", filter: f })),
    ]

    return performMutation({
        mutationFn: () => ppPostData<FullComment>({ url: "comment", data: restOfComment, uid: meta.user_id }),
        onMutate: () => {
            return addDocsInInfiniteQueryResult<MereComment>(
                keyToOptimisticallyUpdate,
                {
                    ...restOfComment,
                    status: "sending",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    likes_count: 0,
                    user_id: meta.user_id,
                    profile: meta.profile,
                    saved_count: 0,
                    edited_at: undefined,
                    parentComment: parent,
                    replied_to: comment.replied_to
                });
        },
        onSuccess: ({ data }) => {
            updateDocInInfiniteQueryResult<{ status: string, _id: string }>(
                keyToOptimisticallyUpdate,
                (r) => {
                    console.log(r, comment);
                    return r._id === comment._id
                },
                { status: "sent" }
            );

            queryClient.setQueryData(
                getQueryKeys("comment_cid", { cid: data._id }),
                data
            );

            refetchQueries(queryKeysToRefetch);
        },
        onError: ({ context }) => {
            const href = section === "replies" && comment.replied_to ? `comment/${comment.replied_to}` : `post/${comment.post_id}`;

            appToast.error(
                () => LinkToast({ title: `Failed to create comment!`, href })
            )

            if (!context) return;
            queryClient.setQueryData(keyToOptimisticallyUpdate, context);
        }
    })
}

export const updateCommentMutation = async (cid: string, uid: string, data: CommentSchemaUpdateType, pid: string) => {
    const queryClient = getQueryClient();

    const commentKey = getQueryKeys("comment_cid", { cid });
    const commentsKey = getQueryKeys("commentsOfPost_pid_filter", { pid, filter: "latest" });
    const commentsOfUserKey = getQueryKeys("commentsOfUser_uid_filter", { uid, filter: "latest" });

    return performMutation({
        mutationFn: () => ppUpdateData({ url: `comment/${cid}`, data, uid }),
        onMutate: () => updateDoc(commentKey, data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: commentsKey });
            queryClient.refetchQueries({ queryKey: commentsOfUserKey });
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to update your comment`, href: `/c/${cid}` })
            )
            if (!context) return;

            queryClient.setQueryData(commentKey, context);
        }
    })
}

export const deleteCommentMutation = async (cid: string, uid: string, pid: string, parent_id?: string) => {
    const queryClient = getQueryClient();

    const commentKey = getQueryKeys("comment_cid", { cid });
    const commentsKey = getQueryKeys("commentsOfPost_pid_filter", { pid, filter: "latest" });
    const commentsOfUserKey = getQueryKeys("commentsOfUser_uid_filter", { uid, filter: "latest" });
    const repliesKey = parent_id ? getQueryKeys("replies_cid_filter", { cid: parent_id, filter: "latest" }) : undefined;

    await performMutation({
        mutationFn: () => ppDeleteData(`comment/${cid}`, uid),
        onMutate: () => {
            const comment = queryClient.getQueryData(commentKey);
            queryClient.removeQueries({ queryKey: commentKey });

            return comment;
        },
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: commentsKey });
            queryClient.refetchQueries({ queryKey: commentsOfUserKey });

            if (repliesKey)
                queryClient.refetchQueries({ queryKey: repliesKey });

        },
        onError: ({ context }) => {
            if (!context) return;
            appToast.error(
                () => LinkToast({ title: `Failed to delete your comment`, href: `/c/${cid}` })
            )
            queryClient.setQueryData(commentKey, context);
        }

    })
}

export const submitReportMutation = async (uid: string, cnid: string, type: ReportTypeEnum, data: ReportSchemaType) => {
    const queryClient = getQueryClient();
    const reportKey = getQueryKeys("ifReportExists_cnid_type", { cnid, type });
    await performMutation({
        mutationFn: () => ppPostData({ url: `report/${cnid}`, uid, data }),
        onMutate: () => {
            queryClient.setQueryData(reportKey, data)
        },
        onError: () => {
            appToast.error(
                () => LinkToast({ title: `Failed to report the ${type}`, href: `/${type}/${cnid}` })
            )
            queryClient.setQueryData(reportKey, null);
        }
    })
}

export const createPostMutation = async (uid: string, data: PostSchemaType, navigation: AppRouterInstance) => {

    return await performMutation({
        mutationFn: () => ppPostData<FullPost>({ url: "post", data, uid }),
        onSuccess: ({ data }) => {
            const postKey = getQueryKeys("post_id", { id: data._id });
            const postsOfUserKey = getQueryKeys("postsOfUser_uid_filter", { uid, filter: "latest" });
            const postsFoThreadKey = getQueryKeys(
                "postsOfThread_tid_filter_category",
                { tid: data.thread_id, filter: "latest", category: data.category }
            )

            const queryClient = getQueryClient();

            queryClient.setQueryData(postKey, data);
            queryClient.refetchQueries({ queryKey: postsOfUserKey });
            queryClient.refetchQueries({ queryKey: postsFoThreadKey });

            navigation.replace(`/p/${data._id}`)
        }
    })

}

export const updatePostMutation = async (pid: string, uid: string, data: PostUpdateSchemaType, tid: string) => {

    const queryClient = getQueryClient();
    const postKey = getQueryKeys("post_id", { id: pid });
    const postsOfUserKey = getQueryKeys("postsOfUser_uid_filter", { uid, filter: "latest" });
    const postsOfThreadKey = getQueryKeys("postsOfThread_tid_filter_category", { tid, filter: "latest", category: data.category || "none" });

    return await performMutation({
        mutationFn: () => ppUpdateData({ url: `post/${pid}`, data, uid }),
        onMutate: () => updateDoc(postKey, data),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: postsOfUserKey });
            queryClient.refetchQueries({ queryKey: postsOfThreadKey });
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to update your post`, href: `/p/${pid}` })
            )
            if (!context) return;

            queryClient.setQueryData(postKey, context);
        }
    })
}

export const deletePostMutation = async (uid: string, pid: string, post: FullPost) => {
    const queryClient = getQueryClient();

    const postKey = getQueryKeys("post_id", { id: pid });
    const postOfThreadKey = getQueryKeys("postsOfThread_tid_filter_category", { tid: post.thread_id, category: post.category, filter: "latest" })
    const postsOfUserKey = getQueryKeys("postsOfUser_uid_filter", { uid: post.user_id, filter: "latest" });

    await performMutation({
        mutationFn: () => ppDeleteData(`post/${pid}`, uid),
        onMutate: () => {
            const post = queryClient.getQueryData(postKey);
            queryClient.removeQueries({ queryKey: postKey });

            return post;
        },
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: postOfThreadKey });
            queryClient.refetchQueries({ queryKey: postsOfUserKey });
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to delete your post`, href: `/p/${pid}` })
            )
            if (!context) return;
            queryClient.setQueryData(postKey, context);
        }
    })
}

export const blockUserMutation = async (uid: string, ruid: string) => {
    const queryClient = getQueryClient();
    const connectionKey = getQueryKeys("connection_ruid", { ruid });

    await performMutation({
        mutationFn: () => ppPostData({ url: `user/${ruid}/block`, uid }),
        onMutate: () => {

            const prevConnection = queryClient.getQueryData(connectionKey);

            queryClient.setQueryData(connectionKey, {
                followBack: false,
                follows: false,
                haveBlocked: true,
                isBlocked: false,
                notification: false
            } as UserConnectionType);

            return prevConnection;
        },
        onError: ({ context }) => {
            appToast.error("Unable to block the user! Please try again");
            if (context) {
                queryClient.setQueryData(connectionKey, context);
            }
        }
    })
}

export const acceptCollaboratorInvitation = async (sid: string) => {
    const user = useCurrentUser.getState().meta;
    if (!user) return;

    const uid = user.user_id;
    const queryClient = getQueryClient();

    const connectionKey = getQueryKeys("shelfConnection_sid", { sid });
    const collaborativeShelvesKey = getQueryKeys("collaboratedShelvesOfUser_uid", { uid });
    const invitedShelvesKey = getQueryKeys("invitedShelvesOfUser_uid", { uid });
    const notificationKeys = getQueryKeys("notifications_uid", { uid });

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `shelf/${sid}/collaborators/action`, uid }),
        onMutate: () => {

            const notifications = updateDocInInfiniteQueryResult<NotificationModelType>(
                notificationKeys,
                ({ metadata, request_type }) => {
                    return Boolean(metadata && request_type && "shelf_id" in metadata && metadata.shelf_id === sid && request_type === "collaborator_invitation")
                },
                { status: "accepted" }
            );

            const connection = updateDoc<CollaboratorModelType>(connectionKey, { type: "collaborator" })

            const invitation = filterDocsInInfiniteQueryResult(invitedShelvesKey, [sid]);

            return { notifications, connection, invitation }
        },
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: collaborativeShelvesKey });
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to accept collaborate invitation`, href: `/s/${sid}` })
            );
            if (!context) return;
            queryClient.setQueryData(connectionKey, context.connection);
            queryClient.setQueryData(invitedShelvesKey, context.invitation);
            queryClient.setQueryData(notificationKeys, context.notifications);
        }
    })
}

export const rejectCollaboratorInvitation = async (sid: string) => {
    const user = useCurrentUser.getState().meta;
    if (!user) return;

    const uid = user.user_id;

    const queryClient = getQueryClient();

    const notificationKeys = getQueryKeys("notifications_uid", { uid });
    const connectionKey = getQueryKeys("shelfConnection_sid", { sid });
    const invitedShelvesKey = getQueryKeys("invitedShelvesOfUser_uid", { uid });

    await performMutation({
        mutationFn: () => ppDeleteData(`shelf/${sid}/collaborators/action`, uid),
        onMutate: () => {
            const notifications = updateDocInInfiniteQueryResult<NotificationModelType>(
                notificationKeys,
                ({ metadata, request_type }) => {
                    return Boolean(metadata && request_type && "shelf_id" in metadata && metadata.shelf_id === sid && request_type === "collaborator_invitation")
                },
                { status: "denied" }
            );

            const connection = updateDoc(connectionKey, { type: "none" });
            const invitation = filterDocsInInfiniteQueryResult(invitedShelvesKey, [sid]);

            return { notifications, connection, invitation }
        },
        onSuccess: () => {
            deleteQueires(connectionKey);
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to reject collaborate invitation`, href: `/s/${sid}` })
            )
            if (!context) return;
            queryClient.setQueryData(connectionKey, context.connection);
            queryClient.setQueryData(invitedShelvesKey, context.invitation);
            queryClient.setQueryData(notificationKeys, context.notifications);
        }
    })
}

export const acceptManagerInvitation = async (tid: string) => {

    const user = useCurrentUser.getState().meta;
    if (!user) return;

    const uid = user.user_id;
    const queryClient = getQueryClient();

    const managersKey = getQueryKeys("threadManagers_tid", { tid });
    const notificationsKey = getQueryKeys("notifications_uid", { uid });
    const createdThreadsKey = getQueryKeys("createdThreadsOfUser_uid", { uid });
    const membershipKey = getQueryKeys("membership_tid", { tid })

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `thread/${tid}/managers/action`, uid }),
        onMutate: () => {

            const notifications = updateDocInInfiniteQueryResult<NotificationModelType>(
                notificationsKey,
                ({ metadata, request_type }) => {
                    return Boolean(metadata && request_type && "thread_id" in metadata && metadata.thread_id === tid && request_type === "manager_invitation")
                },
                { status: "accepted" }
            );

            const managers = updateDoc<ThreadModType>(managersKey, (prev) => {
                if (!prev) return;
                return {
                    ...prev,
                    managers: [{ ...user, role: "moderator" }, ...prev.managers]
                }
            });

            const membership = updateDoc<MembershipModelType>(membershipKey, (prev) => {
                if (!prev) return prev;
                return { ...prev, role: "moderator" }
            })

            return { managers, notifications, membership }
        },
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: createdThreadsKey });
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to accept manager invitation`, href: `/t/${tid}` })
            )
            if (!context) return;
            queryClient.setQueryData(managersKey, context.managers);
            queryClient.setQueryData(notificationsKey, context.notifications);
            queryClient.setQueryData(membershipKey, context.membership);
        }
    })
}

export const rejectManagerInvitation = async (tid: string) => {
    const user = useCurrentUser.getState().meta;
    if (!user) return;

    const uid = user.user_id;

    const queryClient = getQueryClient();

    const managersKey = getQueryKeys("threadManagers_tid", { tid });
    const notificationsKey = getQueryKeys("notifications_uid", { uid });
    const membershipKey = getQueryKeys("membership_tid", { tid })

    await performMutation({
        mutationFn: () => ppDeleteData(`thread/${tid}/managers/action`, uid),
        onMutate: () => {

            const notifications = updateDocInInfiniteQueryResult<NotificationModelType>(
                notificationsKey,
                ({ metadata, request_type }) => {
                    return Boolean(metadata && request_type && "thread_id" in metadata && metadata.thread_id === tid && request_type === "manager_invitation")
                },
                { status: "denied" }
            );

            const managers = updateDoc<ThreadModType>(managersKey, (prev) => {
                if (!prev) return;

                return {
                    ...prev,
                    managers: prev.managers.filter(({ user_id }) => user_id !== uid)
                }
            });

            const membership = updateDoc<MembershipModelType>(membershipKey, (prev) => {
                if (!prev) return prev;
                return { ...prev, role: "moderator" }
            })

            return { managers, notifications, membership }
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to reject manager invitation`, href: `/t/${tid}` })
            )
            if (!context) return;
            queryClient.setQueryData(managersKey, context.managers);
            queryClient.setQueryData(notificationsKey, context.notifications);
            queryClient.setQueryData(membershipKey, context.membership);
        }
    })
}

export const inviteCollaboratorsMutation = async (sid: string, users: ShelfCollaborator[]) => {
    const meta = useCurrentUser.getState().meta;
    if (!meta) return;

    const queryClient = getQueryClient();
    const qkeys = getQueryKeys("shelfCollaborators_sid", { sid });

    const ids = users.map(u => u.user_id);

    await performMutation({
        mutationFn: () => ppPostData({ url: `/shelf/${sid}/collaborators`, data: { users: ids }, uid: meta.user_id }),
        onMutate: () => updateDoc<ShelfCollaborators>(qkeys, (old) => {
            if (!old) return;
            return {
                ...old,
                collaborators: [...old.collaborators, ...users],
            }
        }),
        onError: ({ context }) => {

            console.log("context in inviteCollaborators", context);

            appToast.error(
                () => LinkToast({ title: `Failed to invite collaborators`, href: `/s/${sid}/collaborators` })
            )


            if (!context) return;
            queryClient.setQueryData(qkeys, context);
        }

    })
}

export const removeCollaboratorsMutation = async (sid: string, uid: string, data: { users: string[] }) => {
    const qkey = getQueryKeys("shelfCollaborators_sid", { sid });
    const queryClient = getQueryClient();
    const usersMap = new Map(data.users.map(el => [el, true]));

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `/shelf/${sid}/collaborators`, data, uid }),
        onMutate: () => updateDoc<ShelfCollaborators>(qkey, (old) => {
            if (!old) return;
            return {
                ...old,
                collaborators: old.collaborators.filter(u => !usersMap.has(u.user_id)),
            }
        }),
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to remove collaborators`, href: `/s/${sid}/collaborators` })
            )
            if (!context) return;
            queryClient.setQueryData(qkey, context);
        }
    });
}

export const updateShelvesWithItem = async (
    taleon_id: string,
    taleon_type: "movie" | "show",
    uid: string,
    data: TaleonToAddAndRemoveType,
) => {

    const removedShelvesMap = new Map<string, boolean>(data.remove.map(id => [id, false]));

    const queryClient = getQueryClient();
    const key = getQueryKeys("shelfsForTaleon_cnid", { cnid: taleon_id });

    await performMutation({
        mutationFn: () => ppPostData({ url: `item/${taleon_id}`, data, uid }),
        onMutate: () => {
            const prevData = queryClient.getQueryData(key);

            queryClient.setQueryData<ShelvesForTaleon>(key, (old) => {
                if (!old) return { shelves: data.add };

                return {
                    shelves: [
                        ...old.shelves,
                        ...data.add,
                    ].filter(id => !removedShelvesMap.has(id)),
                }

            });

            return prevData;
        },
        onError: ({ context }) => {

            appToast.error(
                () => LinkToast({ title: `Failed to add taleon in shelves`, href: `/explore/${taleon_type}/${taleon_id}` })
            )

            if (!context) return;
            queryClient.setQueryData(key, context);
        }
    });
}

export const addItemsInShelf = async (sid: string, uid: string, data: ItemsForShelfSchemaType) => {

    const { meta } = useCurrentUser.getState();
    if (!meta) throw new Error("Guest is trying to add items in a shelf");

    const shelfItems: ShelfItemType[] = data.items.map(item => {
        return {
            ...item,
            _id: item.taleon_id || '',
            taleon_id: item.taleon_id || '',
            shelf_id: sid,
            user_id: uid,
            createdAt: Date.now(),
            added_by: meta.username,
        }
    });

    const shelfItemsKey = getQueryKeys("itemsOfShelf_sid_filter", { sid, filter: "latest" })

    await performMutation({
        mutationFn: () => ppPostData({ url: `shelf/${sid}`, data, uid }),
        onMutate: () => addDocsInInfiniteQueryResult<ShelfItemType[]>(shelfItemsKey, shelfItems),
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to add taleons in Shelf`, href: `/s/${sid}` })
            )
            console.log(context);
            if (context) setDoc(shelfItemsKey, context);
        }
    })
}

export const addItemInCollaborativeShelf = async (sid: string, uid: string, taleon: { id: string, type: "movie" | "show", ext_id: string }, isPrivate: boolean, shelfKey: string | undefined) => {
    await performMutation({
        mutationFn: () => ppPostData({ url: `shelf/${sid}/collaborate`, data: { taleon_id: taleon.id }, uid }),
        onSuccess: () => {
            if (isPrivate) refetchQueries(getQueryKeys("itemsOfPrivateShelf_sid_key_filter", { sid, key: shelfKey || "none", filter: "latest" }))
            else refetchQueries(getQueryKeys("itemsOfShelf_sid_filter", { sid, filter: "latest" }))
            appToast.success("Taleon added in shelf successfully.")
        },
        onError: () => {
            appToast.error(
                () => LinkToast({ title: `Failed to add taleons in Shelf`, href: `/explore/${taleon.type}/${taleon.ext_id}` })
            );
        }
    })
}

export const createShelfMutation = async (uid: string, shelf: ShelfSchemaType, navigation?: AppRouterInstance) => {
    return await performMutation({
        mutationFn: () => ppPostData<FullShelf>({ url: "shelf", data: shelf, uid }),
        onSuccess: ({ data }) => {
            const shelfKey = getQueryKeys("shelf_sid", { sid: data._id });
            const publicShelvesOfUser = getQueryKeys("shelvesOfUser_uid_filter", { uid, filter: "latest" });
            const privateShelvesOfUser = getQueryKeys("privateShelvesOfUser_uid", { uid });
            const allShelvesOfUser = getQueryKeys("allShelvesOfUser_uid", { uid });
            const taleons = shelf.items.map(item => item.taleon_id);
            const queryClient = getQueryClient();

            queryClient.setQueryData(shelfKey, data);

            refetchQueries([publicShelvesOfUser, privateShelvesOfUser]);

            addDocsInInfiniteQueryResult<MereShelf>(allShelvesOfUser, {
                _id: data._id,
                isPrivate: data.isPrivate,
                name: data.name,
                poster: data.poster,
                shelf_type: data.shelf_type,
                shelfKey: data.shelfKey,
                item_count: data.item_count,
                saved_count: 0,
            });

            taleons.forEach(taleon_id => {
                if (!taleon_id) return;
                const taleonKey = getQueryKeys("shelfsForTaleon_cnid", { cnid: taleon_id })

                queryClient.setQueryData<ShelvesForTaleon>(taleonKey, (old) => {
                    if (!old) return { shelves: [data._id] };

                    return {
                        shelves: [...old.shelves, data._id]
                    }

                });

            });

            if (navigation) navigation.replace(`/s/${data._id}`);
        }
    })
}

export const editShelfMutation = async (sid: string, uid: string, data: ShelfEditSchemaType) => {
    const shelfKey = getQueryKeys("shelf_sid", { sid });
    const itemsKey = getQueryKeys("itemsOfShelf_sid_filter", { sid, filter: "latest" });

    return await performMutation({
        mutationFn: () => ppUpdateData({ url: `shelf/${sid}`, data, uid }),
        onSuccess: () => {
            updateDoc<FullShelf>(shelfKey, (old) => {
                if (!old) return;
                return {
                    ...old,
                    name: data.name || old.name,
                    isPrivate: data.isPrivate || old.isPrivate,
                }
            });

            if (data.itemsToDelete) {
                filterDocsInInfiniteQueryResult<ShelfItemType>(itemsKey, data.itemsToDelete);
            }
        }
    })

}

export const updateShelfKeyMutation = async (sid: string, uid: string) => {

    return await performMutation({
        mutationFn: () => ppUpdateData({ url: `/shelf/${sid}/shelfkey`, uid }),
        onSuccess: () => refetchQueries(getQueryKeys("shelf_sid", { sid })),
    });
}

export const deleteShelfMutation = async (sid: string, uid: string) => {

    const queryClient = getQueryClient();
    const shelfKey = getQueryKeys("shelf_sid", { sid });
    const createdShelvesKey = getQueryKeys("shelvesOfUser_uid_filter", { uid, filter: "latest" });

    await performMutation({
        mutationFn: () => ppDeleteData(`shelf/${sid}`, uid),
        onMutate: () => {
            const shelf = queryClient.getQueryData(shelfKey);
            queryClient.removeQueries({ queryKey: shelfKey });
            return shelf;
        },
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: createdShelvesKey });
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to delete shelf`, href: `/s/${sid}` })
            )

            if (!context) return;
            queryClient.setQueryData(shelfKey, context);
        }
    })
}

export const banMembersMutation = async (tid: string, uid: string, users: MereUser[]) => {
    const queryClient = getQueryClient();

    const qkey = getQueryKeys("bannedMembers_tid", { tid });
    const uids = users.map(u => u._id);

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `thread/${tid}/banned`, uid, data: { users: uids } }),
        onMutate: () => addDocsInInfiniteQueryResult(qkey, users),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: qkey });
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to ban members`, href: `/t/${tid}/settings/banned` })
            )
            if (!context) return;
            queryClient.setQueryData(qkey, context);
        }
    });
}

export const unbanMembersMutation = async (tid: string, uid: string, data: { users: string[] }) => {
    const queryClient = getQueryClient();

    const qkey = getQueryKeys("bannedMembers_tid", { tid });

    await performMutation({
        mutationFn: () => ppPostData({ url: `thread/${tid}/banned`, uid, data }),
        onMutate: () => filterDocsInInfiniteQueryResult(qkey, data.users),
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to unban members`, href: `/t/${tid}/settings/banned` })
            )
            if (!context) return;
            queryClient.setQueryData(qkey, context);
        }
    });
}

export const createThreadMutation = async (tid: string, uid: string, thread: ThreadSchemaServer) => {

    const threadKey = getQueryKeys("thread_id", { id: tid });

    return await performMutation({
        mutationFn: () => ppPostData({ url: "thread", data: thread, uid }),
        onSuccess: ({ data }) => setDoc(threadKey, data),
    });
}

export const editThreadMutation = async (tid: string, uid: string, updatedData: ThreadUpdateSchema) => {

    const threadKey = getQueryKeys("thread_id", { id: tid });

    return await performMutation({
        mutationFn: () => ppUpdateData({ url: `thread/${tid}`, data: updatedData, uid }),
        onSuccess: ({ data }) => setDoc(threadKey, data)
    })

}

export const inviteManagersMutation = async (tid: string, uid: string, users: ModeratorType[]) => {
    const queryClient = getQueryClient();

    const qkey = getQueryKeys("threadManagers_tid", { tid });
    const uids = users.map(u => u.user_id);

    await performMutation({
        mutationFn: () => ppPostData({ url: `thread/${tid}/managers`, uid, data: { users: uids } }),
        onMutate: () => updateDoc<ThreadModType>(qkey, (prev) => {
            if (!prev) return;

            return {
                ...prev,
                managers: [...users, ...prev.managers]
            }
        }),
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to invite managers`, href: `/t/${tid}/settings/managers` })
            )
            if (!context) return;
            queryClient.setQueryData(qkey, context);
        }
    });
}

export const removeManagersMutation = async (tid: string, uid: string, data: { users: string[] }) => {
    const queryClient = getQueryClient();

    const qkey = getQueryKeys("bannedMembers_tid", { tid });
    const idMap = new Map(data.users.map(u => ([u, true])));

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `thread/${tid}/managers`, uid, data }),
        onMutate: () => updateDoc<ThreadModType>(qkey, (prev) => {
            if (!prev) return;

            return {
                ...prev,
                manager: prev.managers.filter(manager => !idMap.has(manager.user_id))
            }
        }),
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to remove managers`, href: `/t/${tid}/settings/managers` })
            )
            if (!context) return;
            queryClient.setQueryData(qkey, context);
        }
    });
}

export const createRoomMutation = async (rmid: string, room: RoomSchemaType & { display_name: string, poster: string | undefined }, ruid: string | undefined) => {

    const { meta } = useCurrentUser.getState();
    const { updateRoom } = useRoomStore.getState();

    if (!meta) throw new Error("Guest is trying to create a room");

    const { display_name, poster, ...dataToPost } = room;

    const { user_id, username } = meta;
    const uid = user_id;
    const now = Date.now();

    const frame = room.filesData[0];

    const invitationMessage = {
        content: room.inviteMessage,
        createdAt: now,
        user_id,
        username,
    }

    const roomForRoomList: Omit<MereRoomType, "type"> = {
        _id: rmid,
        display_name,
        lastMessage: room.inviteMessage,
        lastMessageAt: now,
        lastMessageBy: user_id,
        mute: false,
        otherParticipant_id: ruid,
        otherParticipant_seenAt: undefined,
        seenAt: now,
        room_type: room.type,
        poster: poster && frame ? { ...frame, path: poster } : undefined,
        room_id: rmid,
        createdAt: now,
    }

    const roomToSet: FullRoomType = {
        ...roomForRoomList,
        display_name,
        participant_count: 1,
        poster: poster && frame ? { ...frame, path: poster } : undefined,
        _id: rmid,
        type: room.type,
        invitationMessage,
        participantType: "creator",
        createdAt: now,
    }

    const messageToSet: MereMessage = {
        ...invitationMessage,
        _id: parloId(),
        room_id: rmid,
        status: "sending",
    }

    const roomKey = getQueryKeys("room_rmid_uid", { rmid, uid });
    const roomListKey = getQueryKeys("rooms_uid", { uid });
    const messagesKey = getQueryKeys("messages_rmid", { rmid });
    const exists = ruid ? getQueryKeys("roomExists_ruid_uid", { ruid, uid }) : [];

    return await performMutation({
        mutationFn: () => ppPostData({ url: `room/${rmid}`, uid, data: dataToPost }),
        onMutate: () => {
            const roomList = addDocsInInfiniteQueryResult(roomListKey, { room_id: rmid, lastMessageAt: Date.now() });

            updateRoom({ ...roomForRoomList, type: "creator" }, rmid);

            setDoc(roomKey, roomToSet);
            addDocsInInfiniteQueryResult(messagesKey, messageToSet);

            return roomList;
        },
        onSuccess: () => {
            refetchQueries([roomListKey, exists]);
            updateDocInInfiniteQueryResult<MereMessage>(
                messagesKey,
                (m) => m._id === messageToSet._id,
                { status: "sent" }
            );
        },
        onError: ({ context }) => {
            if (ruid) {
                appToast.error(
                    () => LinkToast({ title: `Unable to create room with ${display_name}`, href: `/u/${display_name}` })
                )
            } else {
                appToast.error(
                    () => LinkToast({ title: `Unable to create group "${display_name}"`, href: `/room` })
                )
            }
            if (!context) return;
            setDoc(roomListKey, context);
            deleteQueires([roomKey, messagesKey]);
        }
    });
}

export const acceptRoomInvitation = async (rmid: string, uid: string, room: FullRoomType) => {

    const invitationListKey = getQueryKeys("roomInvitations_uid", { uid });
    const roomListKey = getQueryKeys("rooms_uid", { uid });
    const roomKey = getQueryKeys("room_rmid_uid", { rmid, uid });

    const { updateRoom } = useRoomStore.getState();

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `room/${rmid}/invitation`, uid }),
        onMutate: () => {
            const invitations = filterDocsInInfiniteQueryResult<MereRoomType>(invitationListKey, [], (room) => room.room_id !== rmid);
            const roomList = addDocsInInfiniteQueryResult(roomListKey, { room_id: rmid, lastMessageAt: room.lastMessageAt });
            const roomData = updateDoc<FullRoomType>(roomKey, { participantType: "participant" });

            const { type, ...rest } = room;

            updateRoom({ ...rest, room_id: rmid, type: room.participantType }, rmid);

            return { invitations, roomList, roomData }
        },
        onError: ({ context }) => {
            if (!context) return;
            appToast.error(
                () => LinkToast({ title: `Failed to accept room invitation`, href: `/room/${rmid}` })
            );
            setDoc(invitationListKey, context.invitations);
            setDoc(roomListKey, context.roomList);
            setDoc(roomKey, context.roomData);
        }
    })

}

export const rejectRoomInvitation = async (rmid: string, uid: string) => {

    const invitationListKey = getQueryKeys("roomInvitations_uid", { uid });

    await performMutation({
        mutationFn: () => ppDeleteData(`room/${rmid}/participant`, uid),
        onMutate: () => filterDocsInInfiniteQueryResult(invitationListKey, [rmid]),
        onError: ({ context }) => {
            if (!context) return;
            appToast.error(
                () => LinkToast({ title: `Failed to reject room invitation`, href: `/room/${rmid}` })
            );
            setDoc(invitationListKey, context);
        }
    })
}

export const showMessageOptimistically = ({ message, uid }: { message: MereMessage, uid: string }) => {

    const roomKey = getQueryKeys("rooms_uid", { uid: uid });
    const { room_id } = message;

    const roomToUpdate = useRoomStore.getState().room[room_id];
    const { updateRoom } = useRoomStore.getState();

    if (roomToUpdate) {
        updateRoom({
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            lastMessageBy: message.user_id,
        }, room_id);

        addDocsInInfiniteQueryResult(roomKey, { room_id, lastMessageAt: Date.now() });

    } else {
        refetchQueries(roomKey);
    }

    addDocsInInfiniteQueryResult<MereMessage>(
        getQueryKeys("messages_rmid", { rmid: message.room_id }),
        message
    );
}

export const sendMessage = async (rmid: string, uid: string, message: MessageSchemaType) => {
    const messageListKey = getQueryKeys("messages_rmid", { rmid });
    const { updateRoom } = useRoomStore.getState();

    await performMutation({
        mutationFn: () => ppPostData({ url: `room/${rmid}/message`, uid, data: message }),
        onMutate: () => {
            updateRoom({ status: "sending" }, rmid);
            return addDocsInInfiniteQueryResult<MereMessage>(
                messageListKey,
                {
                    ...message,
                    status: "sending",
                    room_id: rmid,
                    user_id: uid
                });
        },

        onSuccess: () => {
            updateRoom({
                status: undefined,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                lastMessageBy: uid,
            }, rmid);

            updateDocInInfiniteQueryResult<MereMessage>(
                messageListKey,
                (m) => m._id === message._id,
                { status: undefined }
            );
        },
        onError: () => {
            updateRoom({ status: "error" }, rmid);

            updateDocInInfiniteQueryResult<MereMessage>(
                messageListKey,
                (m) => m._id === message._id,
                { status: "error" }
            )
        },
    })
}

export const sendContentToRooms = async (rooms: string[], data: Omit<SharedContentSchemaType, "rooms">, uid: string, username: string) => {
    const messageListKeys = rooms.map(rmid => getQueryKeys("messages_rmid", { rmid }));
    const { updateRoom } = useRoomStore.getState();

    const temp_ids = Array(rooms.length).fill(0).map(() => parloId());

    const message = {
        content: data.message || '',
        createdAt: Date.now(),
        sharedContent: data.contentPath,
    }

    await performMutation({
        mutationFn: () => ppPostData<Record<string, string>>({ url: "room/share", uid, data: { ...data, rooms } }),
        onMutate: () => {
            return rooms.map((rmid, i) => {
                updateRoom({ status: "sending" }, rmid);
                return addDocsInInfiniteQueryResult<MereMessage>(
                    messageListKeys[i],
                    {
                        ...message,
                        status: "sending",
                        room_id: rmid,
                        user_id: uid,
                        username,
                        _id: temp_ids[0],
                    });
            });
        },
        onSuccess: ({ data }) => {
            rooms.forEach((rmid, i) => {
                updateRoom({
                    status: undefined,
                    lastMessage: "You shared a content",
                    lastMessageAt: message.createdAt,
                    lastMessageBy: uid,
                }, rmid);

                updateDocInInfiniteQueryResult<MereMessage>(
                    messageListKeys[i],
                    (m) => m._id === temp_ids[i],
                    { status: undefined, _id: data[rmid] }
                );
            })
        },
        onError: () => {
            rooms.forEach((rmid, i) => {
                updateRoom({ status: "error" }, rmid);

                updateDocInInfiniteQueryResult<MereMessage>(
                    messageListKeys[i],
                    (m) => m._id === temp_ids[i],
                    { status: "error" }
                );
            })
        },
    })
}

export const retryMessage = async (msg_id: string, rmid: string, uid: string, message: MereMessage) => {
    const messageListKey = getQueryKeys("messages_rmid", { rmid });
    const { updateRoom } = useRoomStore.getState();

    await performMutation({
        mutationFn: () => ppPostData({ url: `room/${rmid}/message`, uid, data: message }),
        onMutate: () => {
            updateRoom({ status: "sending" }, rmid);
            return updateDocInInfiniteQueryResult<MereMessage>(
                messageListKey,
                (message) => message._id === msg_id,
                {
                    status: "sending",
                }
            );
        },

        onSuccess: () => {
            updateRoom({
                status: undefined,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                lastMessageBy: uid,
            }, rmid);

            updateDocInInfiniteQueryResult<MereMessage>(
                messageListKey,
                (m) => m._id === message._id,
                { status: undefined }
            )
        },
        onError: () => {
            updateRoom({ status: "error" }, rmid);

            updateDocInInfiniteQueryResult<MereMessage>(
                messageListKey,
                (m) => m._id === message._id,
                { status: "error" },
            )
        },
    })
}

export const updateParticipantSeenAt = async (rmid: string, uid: string) => {

    const roomKey = getQueryKeys("room_rmid_uid", { rmid, uid });

    const { updateRoom } = useRoomStore.getState();

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `room/${rmid}/participant`, uid }),
        onMutate: () => {
            updateDoc<FullRoomType>(roomKey, { seenAt: Date.now() });

            updateRoom({ seenAt: Date.now() }, rmid);

        }
    })
}

export const unsendMessage = async (rmid: string, msgid: string, uid: string) => {

    const messagesKey = getQueryKeys("messages_rmid", { rmid });

    await performMutation({
        mutationFn: () => ppDeleteData(`room/${rmid}/message/${msgid}`, uid),
        onMutate: () => filterDocsInInfiniteQueryResult<MereMessage>(messagesKey, [msgid]),
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to unsend message`, href: `/room/${rmid}` })
            );

            if (context) setDoc(messagesKey, context);
        }
    })

}

export const updateNotificationOfRoom = async (rmid: string, uid: string, newState: boolean) => {
    const roomKey = getQueryKeys("room_rmid_uid", { rmid, uid })

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `room/${rmid}/notification`, data: { notification: newState }, uid }),
        onMutate: () => updateDoc<FullRoomType>(roomKey, { mute: newState }),
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to update notification of room`, href: `/room/${rmid}` })
            );
            setDoc(roomKey, context);
        }
    })
}

export const leaveRoom = async (rmid: string, uid: string) => {
    const roomListKey = getQueryKeys("rooms_uid", { uid });
    const roomKey = getQueryKeys("room_rmid_uid", { rmid, uid });
    const messagesKey = getQueryKeys("messages_rmid", { rmid });

    await performMutation({
        mutationFn: () => ppDeleteData(`room/${rmid}/participant`, uid),
        onMutate: () => filterDocsInInfiniteQueryResult(roomListKey, [rmid]),
        onSuccess: () => {
            deleteQueires([roomKey, messagesKey])
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to leave room`, href: `/room/${rmid}` })
            );
            setDoc(roomListKey, context);
        }
    })
}

export const hideRoom = async (rmid: string, uid: string) => {
    const roomListKey = getQueryKeys("rooms_uid", { uid });
    const roomKey = getQueryKeys("room_rmid_uid", { rmid, uid });
    const messagesKey = getQueryKeys("messages_rmid", { rmid });

    await performMutation({
        mutationFn: () => ppUpdateData({ url: `room/${rmid}/hide`, uid }),
        onMutate: () => filterDocsInInfiniteQueryResult(roomListKey, [rmid]),
        onSuccess: () => {
            deleteQueires([roomKey, messagesKey])
        },
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to leave room`, href: `/room/${rmid}` })
            );
            setDoc(roomListKey, context);
        }
    })
}

export const inviteParticipants = async (rmid: string, uid: string, participants: string[]) => {
    await performMutation({
        mutationFn: () => ppPostData({ url: `room/${rmid}/participant/invite`, uid, data: { users: participants } }),
        onError: () => {
            appToast.error(
                () => LinkToast({ title: `Failed to invite participants`, href: `/room/${rmid}/participants` })
            );
        }
    })
}

export const removeParticipants = async (rmid: string, uid: string, participants: string[]) => {

    const participantsKey = getQueryKeys("participantsOfRoom_rmid_uid", { rmid, uid });
    await performMutation({
        mutationFn: () => ppPostData({ url: `room/${rmid}/participant/remove`, uid, data: { users: participants } }),
        onMutate: () => filterDocsInInfiniteQueryResult(participantsKey, participants),
        onError: ({ context }) => {
            appToast.error(
                () => LinkToast({ title: `Failed to remove participants`, href: `/room/${rmid}/participants` })
            );

            if (context) setDoc(participantsKey, context);
        }
    })
}

export const updateUser = async (update: UserUpdateSchemaType) => {

    const { meta, setUserMeta, user, setUser } = useCurrentUser.getState();
    if (!meta || !user) throw new Error("Guest is trying to update their profile");

    const uid = meta.user_id;
    const { username } = meta;

    return await performMutation({
        mutationFn: () => ppUpdateData({ url: "user", data: update, uid }),
        onSuccess: ({ data }: { data: CurrentUser }) => {

            setUser({ ...user, ...data })

            updateDoc(getQueryKeys("user_username", { username }), data);

            if ("dob" in data || "profile" in data || "filterContent" in data) {

                const { dob, profile, filterContent } = data;
                setUserMeta({
                    ...meta,
                    ...(dob && { dob }),
                    ...(profile && { profile }),
                    ...(filterContent && { filterContent })
                })
            }

            appToast.success("Profile updated successfully");

        }
    })

}

export const updateUsername = async (update: Omit<UsernameUpdateSchemaType, | "fingerprint">) => {
    const { meta, setUserMeta, user, setUser } = useCurrentUser.getState();
    if (!meta || !user) throw new Error("Guest is trying to update their profile");

    const uid = meta.user_id;

    const fingerprint = await generateFingerprint();

    return await performMutation({
        mutationFn: () => ppUpdateData({ url: "user/creds/username", data: { ...update, fingerprint }, uid }),
        onSuccess: () => {
            const { username } = update;

            setDoc(getQueryKeys("user_username", { username }), { ...user, username });

            setUser({ ...user, username })

            deleteQueires(getQueryKeys("user_username", { username: meta.username }));

            setUserMeta({ ...meta, username });

            appToast.success("Username updated successfully");
        }
    })
}

export const updateEmail = async (update: Omit<EmailUpdateSchemaType, "fingerprint">) => {
    const { meta, user, setUser } = useCurrentUser.getState();
    if (!meta || !user) throw new Error("Guest is trying to update their profile");

    const uid = meta.user_id;

    const fingerprint = await generateFingerprint();

    return await performMutation({
        mutationFn: () => ppUpdateData({ url: "user/creds/email", data: { ...update, fingerprint }, uid }),
        onSuccess: () => {
            setUser({ ...user, email: update.email });
        }
    })
}

export const toggleContentFiltering = async () => {
    const { meta, user, setContentFiltering } = useCurrentUser.getState();
    if (!meta || !user) throw new Error("Guest is trying to update content filtering");

    const uid = meta.user_id;
    await performMutation({
        mutationFn: () => ppUpdateData({ url: "user/content_filtering", uid }),
        onSuccess: () => setContentFiltering(!user.filterContent),
        onError: () => {
            appToast.error(
                () => LinkToast({ title: `Failed to toggle content filtering`, href: `/settings/filter_content` })
            );
        }
    })

}

const removeUser = () => {
    useCurrentUser.getState().clearUser();
    getQueryClient().clear();
    offlineStore.getState().clear();
}

export const logoutUser = async () => {
    await performMutation({
        mutationFn: () => axios.delete(`${parloculaAppURL}/api/v1/user/logout`),
        onMutate: removeUser
    });
}

export const deactivateAccount = async (uid: string, passkey: string) => {
    return await performMutation({
        mutationFn: () => ppUpdateData({ url: "user/deactivate", uid, data: { passkey } }),
        onSuccess: removeUser
    });
}

export const deleteAccount = async (uid: string, reason: string, passkey: string) => {
    return await performMutation({
        mutationFn: () => ppUpdateData({ url: "user/delete_account", uid, data: { passkey, reason } }),
        onSuccess: removeUser
    });
}

export const updateFeedViewed = async (uid: string, posts: string[]) => {
    await ppPostData({ url: `user/feed/viewed`, uid, data: { posts } })
}

export const invalidateSession = async (data: SessionInvalidationServerSchemaType) =>
    await trycatch<GeneralPostReturn>(() =>
        axios.patch(
            `${parloculaAppURL}/api/v1/user/login`,
            objectToFormData(data)
        )
            .then((r) => r.data)
            .catch(r => r.response.data),
    );

export const joinThread = async (tid: string, uid: string) => {
    const resp = await ppPostData({
        url: `thread/${tid}/member`,
        data: null,
        uid,
    });

    return handleErrorFromMutation(resp);
}

export const leaveThread = async (tid: string, uid: string) => {
    const resp = await ppDeleteData(`thread/${tid}/member`, uid);

    return handleErrorFromMutation(resp);
}

export const changeThreadNotification = async (tid: string, uid: string, newState: boolean) => {
    const resp = await ppUpdateData({
        url: `thread/${tid}/member`,
        uid,
        data: { notification: newState },
    });

    return handleErrorFromMutation(resp);
}

export const addReactionOnPost = async (uid: string, pid: string, reaction: string) => {
    const resp = await ppPostData({
        url: `post/${pid}/reaction`,
        data: { reaction },
        uid,
    });

    return handleErrorFromMutation(resp);
}

export const removeReactionOnPost = async (pid: string, uid: string) => {
    const resp = await ppDeleteData(`post/${pid}/reaction`, uid);

    return handleErrorFromMutation(resp);
}

export const likeComment = async (cid: string, uid: string, data: LikeSchemaType) => {
    const resp = await ppPostData({
        url: `comment/${cid}/like`,
        data,
        uid,
    });

    return handleErrorFromMutation(resp);
}

export const dislikeComment = async (cid: string, uid: string) => {
    const resp = await ppDeleteData(`comment/${cid}/like`, uid);

    return handleErrorFromMutation(resp);
}

export const saveItem = async (data: BookmarkSchemaType, uid: string) => {
    const resp = await ppPostData({
        url: "bookmark",
        data,
        uid,
    });

    return handleErrorFromMutation(resp);
}

export const unsaveItem = async (id: string, uid: string) => {
    const resp = await ppDeleteData(`bookmark/${id}`, uid);

    return handleErrorFromMutation(resp);
}

export const follow = async (uid: string, rid: string) => {
    const resp = await ppPostData({
        url: `user/${rid}/follow`,
        data: null,
        uid,
    });

    return handleErrorFromMutation(resp);
}

export const blockUser = async (uid: string, rid: string) => {
    const resp = await ppPostData({
        url: `user/${rid}/block`,
        data: null,
        uid,
    });

    return handleErrorFromMutation(resp);
}

export const unfollow = async (uid: string, rid: string) => {
    const resp = await ppDeleteData(`user/${rid}/follow`, uid);

    return handleErrorFromMutation(resp);
}

export const unblock = async (uid: string, rid: string) => {
    const resp = await ppDeleteData(`user/${rid}/block`, uid);

    return handleErrorFromMutation(resp);
}

export const modifyUserNotification = async (
    uid: string,
    rid: string,
    data: { notification: boolean }
) => {
    const resp = await ppUpdateData({
        url: `user/${rid}/follow`,
        data,
        uid,
    });

    return handleErrorFromMutation(resp);
}

export const removeFollower = async (uid: string, rid: string) => {
    const resp = await ppDeleteData(`user/${rid}/follower`, uid);

    return handleErrorFromMutation(resp);
}

export const actionOnReportedContents = async (tid: string, uid: string, data: ReportActionSchemaType) => {
    const resp = await ppUpdateData({
        url: `report/${tid}`,
        uid,
        data,
    });

    return handleErrorFromMutation(resp);
}
