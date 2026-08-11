
import { addReactionOnPost, blockUser, changeThreadNotification, dislikeComment, follow, joinThread, leaveThread, likeComment, modifyUserNotification, removeFollower, removeReactionOnPost, saveItem, unblock, unfollow, unsaveItem } from "@lib/frontend/helpers/mutations";
import { localForageStorage } from "@store/utils";

const mutations = {
    join_thread: joinThread,
    update_thread_notification: changeThreadNotification,
    leave_thread: leaveThread,
    follow_user: follow,
    unfollow_user: unfollow,
    block_user: blockUser,
    unblock_user: unblock,
    remove_follower: removeFollower,
    update_user_notification: modifyUserNotification,
    create_reaction: addReactionOnPost,
    remove_reaction: removeReactionOnPost,
    like_comment: likeComment,
    dislike_comment: dislikeComment,
    save_content: saveItem,
    unsave_content: unsaveItem,
}

export type AvailableMutations = keyof typeof mutations;

export type MutationMap = typeof mutations;

export type MutationFunctionAgruments<T extends AvailableMutations> = Parameters<MutationMap[T]>

type Mutation<T extends AvailableMutations> = {
    payload: MutationFunctionAgruments<T>,
    type: T
}

type Store = Map<string, Mutation<AvailableMutations>>;

const mutationStoreKey = "mutations_store";
let globalStore: Store | null = null;

export const getStore = async (): Promise<Store> => {
    if (globalStore) return globalStore;
    const raw = await localForageStorage.getItem(mutationStoreKey);

    if (!raw) {
        globalStore = new Map<string, Mutation<AvailableMutations>>();
        return globalStore;
    }

    try {
        const entries = JSON.parse(raw);
        globalStore = new Map(entries);
        return globalStore;
    } catch (e: any) {
        console.warn("Error occured while parsing mutation entries", e.message);
        globalStore = new Map();
        return globalStore;
    }

}

const updateStore = (store: Store) => {
    globalStore = store;
    localForageStorage.setItem(mutationStoreKey, Array.from(store.entries()));
}

export const setMutation = async <M extends AvailableMutations>(key: string, mutation: Mutation<M>) => {
    const store = await getStore();
    store.set(key, mutation);
    updateStore(store);
}

export const removeMutation = async (key: string) => {
    const store = await getStore();
    store.delete(key);
    updateStore(store);
}

const getMutationAndFunction = (store: Store, key: string) => {
    const mutation = store.get(key);

    if (!mutation) {
        console.warn("No mutation was found with the provided key", key);
        return false;
    }

    const mutationType = mutation.type;
    const mutationFn = mutations[mutationType] as (...a: any) => any;

    if (!mutationFn) {
        console.error("Could not get the correct mutation function for", mutationType);
        return false;
    }

    return { mutation, mutationFn };
}

export const performMutation = async (key: string, skipUpdate?: boolean) => {
    const store = await getStore();

    const response = getMutationAndFunction(store, key);
    if (!response) return false;

    const { mutation, mutationFn } = response;

    const error = await mutationFn(...mutation.payload);

    if (error) {
        console.error("Mutation failed for", mutation.type, error);
        return false;
    }

    store.delete(key);
    if (!skipUpdate) updateStore(store);

    return true;


}

export const performAllMutations = async () => {

    const store = await getStore();

    let resolvedMutations = 0;
    let rejectedMutations = 0;
    const totalMutations = store.size;

    const queue = await Promise.all(
        store.keys().map(key => performMutation(key, true))
    );

    queue.forEach(entry => {
        if (entry) {
            resolvedMutations++
        } else {
            rejectedMutations++
        }
    });

    if (queue.length)
        updateStore(store);

    return {
        resolvedMutations,
        rejectedMutations,
        totalMutations,
    }

}