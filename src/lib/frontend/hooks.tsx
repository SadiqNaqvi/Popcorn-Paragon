"use client";

import useOfflineStore from "@store/offlineStore";
import useCurrentUser from "@store/user";
import { InfiniteData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { PaginatedData, RefinedGeneralData } from "@type/external";
import { AggregatedResponse, GeneralGetReturn, GeneralMultipleReturn, InfiniteQueryResponse, MerePost } from "@type/internal";
import { HistoryStackType } from "@type/other";
import { PresenceMessage } from "ably";
import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { oneHourInMiliSeconds, oneHourInSeconds } from "../shared/constants";
import { fetchTrendingMovies, fetchTrendingShows } from "@lib/shared/helpers/external_fetchers";
import { getQueryClient } from "../backend/providers/queryClient";
import { getTrendingPosts, getUserFeed } from "../shared/helpers/internal_fetchers";
import { getQueryKeys, infiniteScrollerResponse, refineResponseForInfiniteQuery, refineResponseForQuery } from "../shared/utils";
import { getAblyOnClient } from "./providers/ably";

type InfiniteQueryProps<T> = {
    queryFn: (pageParams: number) => Promise<GeneralMultipleReturn<T> | GeneralGetReturn<PaginatedData>>,
    queryKeys: (string | number)[],
    initialPage?: number,
    initialData?: { data: T[], total: number } | null,
    staleTimeInSec?: number,
    enable?: boolean,
    placeholderData?: PaginatedData<T> | AggregatedResponse<T>,
    onSuccess?: (data: InfiniteData<InfiniteQueryResponse<T>, number>) => void,
}

export const useInfiniteQueryHook = <T,>({ queryKeys, queryFn, onSuccess, placeholderData, initialData, initialPage = 1, enable = true, staleTimeInSec = oneHourInSeconds }: InfiniteQueryProps<T>) => {
    const response = useInfiniteQuery<
        InfiniteQueryResponse<T>, Error, InfiniteData<InfiniteQueryResponse<T>, number>, (string | number)[], number
    >({
        queryKey: queryKeys,
        initialPageParam: initialData ? initialPage + 1 : initialPage,
        staleTime: staleTimeInSec * 1000,
        gcTime: staleTimeInSec * 1000 * 2,
        placeholderData: placeholderData ? { pageParams: [1], pages: [infiniteScrollerResponse(placeholderData, initialPage)] } : undefined,
        queryFn: async ({ pageParam = 1 }) =>
            refineResponseForInfiniteQuery(
                () => queryFn(pageParam), pageParam
            ),
        initialData: initialData ? { pageParams: [1], pages: [infiniteScrollerResponse(initialData, initialPage)] } : undefined,
        getNextPageParam: (lp: any): number | undefined => {
            return lp && lp.page < lp.total_pages ? lp.page + 1 : undefined;
        },
        enabled: Boolean(!initialData && enable),
        retry: false, refetchOnWindowFocus: false, retryOnMount: false, refetchOnMount: false, refetchOnReconnect: false
    });

    const { data, isError } = response;

    useEffect(() => {

        if (data && !isError) onSuccess?.(data)

    }, [data, isError, onSuccess])

    return response;

}

type NonFunctionGuard<T> = T extends Function ? never : T

type QueryFn<T> = () => Promise<GeneralGetReturn<T>>
type UseQueryProps<T,> = {
    queryKeys: (string | number)[],
    queryFn: QueryFn<T>,
    enabled?: boolean,
    initialData?: T,
    staleTime?: number,
    onSuccess?: (d: T) => void,
    placeholderData?: T,
}

export const useQueryHook = <T,>({ queryKeys, onSuccess, queryFn, initialData, placeholderData, staleTime, enabled = true }: UseQueryProps<T>) => {
    const defaultStaleTime = Date.now() + oneHourInMiliSeconds;
    const response = useQuery<T | null>({
        queryKey: queryKeys,
        queryFn: () => refineResponseForQuery(queryFn),
        enabled,
        staleTime: staleTime || defaultStaleTime,
        gcTime: defaultStaleTime,
        placeholderData: placeholderData as NonFunctionGuard<T>,
        initialData,
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retryOnMount: false,
    });

    const { data, isError } = response;


    useEffect(() => {

        if (data && !isError) onSuccess?.(data)

    }, [data, isError, onSuccess])

    return response;
}

const reducer = <T,>(state: T, action: Partial<T>): T => {
    if (!action) return state;
    return { ...state, ...action };
}

export const useCustomReducer = <T,>(initialValue: T) => {
    const [state, dispatch] = useReducer(reducer<T>, initialValue);

    const setter = (value: Partial<T>) => dispatch(value);

    return { ...state, setter };
}

type PresenceEnum = "offline" | "online" | "typing";

export const useAblyPresence = (client_id: string, id?: string, room_id?: string) => {
    const [presence, setPresence] = useState<PresenceEnum>("offline");

    useEffect(() => {
        if (!id) return;
        const ably = getAblyOnClient(client_id);
        const channel = ably.channels.get(id);

        const watchPresence = (presence: PresenceMessage) => {
            if (!presence) return;
            const { action, data } = presence;

            if (action === "enter" || action === "present") {
                setPresence("online");
            }

            else if (action === "update" && room_id) {
                if (!("status" in data) || !("room_id" in data)) return;
                else if (data.status === "started_typing" && data.room_id === room_id)
                    setPresence("typing");
                else setPresence("online")
            }

            else if (action === "absent" || action === "leave")
                setPresence("offline")
        }

        channel.presence.get().then(presences => {
            const [presence] = presences;
            console.log("presence on mount", presence)
            watchPresence(presence);
        })

        channel.presence.subscribe(watchPresence);

        return () => {
            channel.presence.unsubscribe(watchPresence)
        }

    }, [client_id, id, room_id]);

    if (!id) return "";

    return presence;

}

export const useOptionalState = <T,>(initial: T) => {
    return useState<T>(initial);
}

type MutationStoreProps<T = unknown> = {
    url: string,
    data?: T,
    type: "Post" | "Patch" | "Put" | "Delete"
    status: "pending" | "fulfilled"
}

type MutationStoreType<T = unknown> = Map<string, MutationStoreProps<T>>;

type MutationStoreReturn<T> = {
    store: MutationStoreType,
    get: (k: string) => MutationStoreProps<T> | undefined,
    set: (k: string, data: Omit<MutationStoreProps<T>, "status">, delayInSec?: number) => void
    del: (k: string) => void,
    mutate: (k: string) => void,
    flush: () => void,
}

export const useMutationStore = <T = unknown>(): MutationStoreReturn<T> => {
    const store = useRef<MutationStoreType<T>>(new Map());
    const timeOutKey = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const serialize = (map: MutationStoreType<T>): string => {
        return JSON.stringify(Object.fromEntries(map.entries()));
    };

    const deserialize = (data: string | null): MutationStoreType<T> => {
        if (!data) return new Map();
        try {
            const obj = JSON.parse(data);
            return new Map(Object.entries(obj)) as MutationStoreType<T>;
        } catch {
            return new Map();
        }
    };

    const syncLocalStorage = () => {
        localStorage.setItem("mutationStore", serialize(store.current!));
    };

    const loadStore = () => {
        store.current = deserialize(localStorage.getItem("mutationStore"));
    };

    const mutate = (k: string) => {
        const item = store.current?.get(k);
        if (!item) return;
        if (item.status === "pending") return;

        const { post, put, patch, delete: del } = axios;

        let fn: (() => Promise<any>) | null = null;
        if (item.type === "Post") fn = () => post(item.url, item.data);
        else if (item.type === "Put") fn = () => put(item.url, item.data);
        else if (item.type === "Patch") fn = () => patch(item.url, item.data);
        else if (item.type === "Delete") fn = () => del(item.url);

        item.status = "pending";
        syncLocalStorage();

        fn?.().then(() => {
            store.current.delete(k);
            syncLocalStorage();
        }, () => {
            item.status = "fulfilled";
        }).catch(() => item.status = "fulfilled");
    }

    const flush = () => {
        store.current?.forEach((_, key) => {
            mutate(key);
        });
    }

    useEffect(() => {
        loadStore();

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") flush();
        };

        const handleOnline = () => flush();

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("online", handleOnline);

        return () => {
            syncLocalStorage();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    return {
        store: store.current,
        get: (k) => store.current.get(k),
        set: (k, d, t) => {
            if (!store.current) store.current = new Map();

            store.current.set(k, { ...d, status: "pending" });

            syncLocalStorage();

            if (t) {
                clearTimeout(timeOutKey.current.get(k))
                timeOutKey.current.set(k, setTimeout(() => {
                    mutate(k)
                    timeOutKey.current.delete(k);
                }, t * 1000));
            }
        },
        del: (k) => {
            store.current.delete(k)
            syncLocalStorage();
        },
        mutate,
        flush,
    }

}

type AggregatedPost = MerePost & { score: number }
type TmdbSlide = { _id: string, isSlide: true, title: string, data: RefinedGeneralData[] };
export type FeedPost = AggregatedPost | TmdbSlide;
type CachedResponse = InfiniteData<InfiniteQueryResponse<AggregatedPost>>;

const refineResponse = (resp: GeneralGetReturn<AggregatedResponse<AggregatedPost>>): AggregatedResponse<AggregatedPost> => {
    if (!resp) return { data: [], total: 0 }
    const { success, errCode, result } = resp;
    if (success) return result;
    else {
        console.warn("Error occured:", errCode);
        return { data: [], total: 0 }
    }
}

const getTmdbSlides = async (p: number): Promise<Omit<TmdbSlide, "isSlide">[]> => {
    const [firstSlide, secondSlide] = await Promise.all([
        fetchTrendingMovies(p),
        fetchTrendingShows(p)
    ]);

    return [
        { data: firstSlide?.results || [], title: "Trending Movies", _id: `trending_movies_page_${p}` },
        { data: secondSlide?.results || [], title: "Trending Shows", _id: `trending_shows_page_${p}` }
    ]
}

const trendingPostsFromCacheOrSource = async (p: number, allowNsfw: boolean): Promise<GeneralMultipleReturn<AggregatedPost>> => {

    const queryClient = getQueryClient();
    const cache = queryClient.getQueryData<CachedResponse>(getQueryKeys("trendingPosts", {}));
    const cachedPosts = cache?.pages[p];
    if (cachedPosts) return { success: true, result: { data: cachedPosts.results, total: cachedPosts.total_results } };
    else return await getTrendingPosts(p, allowNsfw);
}

const curatedPostsFromCacheOrSource = async (uid: string, p: number, allowNsfw: boolean): Promise<GeneralMultipleReturn<AggregatedPost>> => {

    const queryClient = getQueryClient();
    const cache = queryClient.getQueryData<CachedResponse>(getQueryKeys("curatedPost_uid", { uid }));
    const cachedPosts = cache?.pages[p];
    if (cachedPosts) return { success: true, result: { data: cachedPosts.results, total: cachedPosts.total_results } };
    else return await getUserFeed(uid, p, allowNsfw);
}

export const useFeedHook = (allowNsfw: boolean) => {
    const { meta } = useCurrentUser();
    const uid = meta?.user_id;
    const [placeholder, setPlaceholder] = useOfflineStore<AggregatedResponse | undefined>(`usersFeed:${uid ?? "guest"}`, undefined);
    const uniqueFeedPostsMap: Record<string, true> = {}

    const queryFn = async (p: number): Promise<GeneralMultipleReturn<FeedPost>> => {

        const [slides, trending, curated] = await Promise.all([
            getTmdbSlides(p),
            trendingPostsFromCacheOrSource(p, allowNsfw),
            ...(uid ? [curatedPostsFromCacheOrSource(uid, p, allowNsfw)] : []),
        ]);

        const trendingPosts = refineResponse(trending);
        const curatedPosts = refineResponse(curated);

        let finalFeed: FeedPost[] = [];

        const interval = Math.floor((trendingPosts.data.length + curatedPosts.data.length) / 2);

        if (interval !== 0) {

            const sortedPosts = trendingPosts.data.concat(curatedPosts?.data || [])
                .sort((a, b) => b.score - a.score);

            for (let i = 0; i < sortedPosts.length; i++) {
                const post = sortedPosts[i];

                if (post._id in uniqueFeedPostsMap) continue;

                uniqueFeedPostsMap[post._id] = true;

                finalFeed.push(post);

                if ((i + 1) % interval === 0) {
                    const index = ((i + 1) / interval) - 1;
                    const slide = slides[index];

                    if (slide && "data" in slide && slide.data.length) {
                        finalFeed.push({ ...slide, isSlide: true })
                    }
                }
            }
        } else {
            finalFeed = slides.map(slide => ({ ...slide, isSlide: true }));
        }


        const queryPage = {
            data: finalFeed,
            total: Math.max(trendingPosts.total || 0, curatedPosts.total || 0)
        }

        if (p === 1) setPlaceholder(queryPage);

        return { success: true, result: queryPage };
    }

    return useInfiniteQueryHook<FeedPost>({
        queryFn,
        queryKeys: ["usersFeed", uid || "guest"],
        placeholderData: placeholder,
    });
}

export const useDebounce = <T,>(
    mutationFn: (initialState: T, finalState: T) => void,
    config?: {
        skipInSeconds?: number,
        initial?: any
    }
) => {
    const { skipInSeconds = 5, initial } = config ?? {};
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialState = useRef<T>(initial);
    const finalState = useRef<T>(initial);

    useEffect(() => {
        return () => {

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            const changed = JSON.stringify(initialState.current) !== JSON.stringify(finalState.current);

            if (changed) {
                mutationFn(initialState.current, finalState.current);
            }
        }
    }, []);

    const mutate = () => {
        const timeout = timeoutRef.current;
        if (timeout) {
            clearTimeout(timeout)
        }

        timeoutRef.current = setTimeout(
            () => mutationFn(initialState.current, finalState.current),
            skipInSeconds * 1000
        );
    }

    const setInitialState = (arg: any) => {
        initialState.current = arg;
    }

    const setFinalState = (arg: any) => {
        finalState.current = arg;
    }

    return { mutate, setInitialState, setFinalState }

}

export const useHistoryStack = () => {
    const [historyStack, setHistoryStack] = useOfflineStore<HistoryStackType[]>("historyStack", []);

    const pushInStack = (member: HistoryStackType) => {
        let tempStack = [...(historyStack || [])]
        if (tempStack.length >= 10) {
            tempStack.pop();
        }
        tempStack = tempStack.filter(h => h.path !== member.path);
        tempStack.push(member);
        setHistoryStack(tempStack);
    }

    const removeFromStack = (path: string) => {
        setHistoryStack(historyStack.filter(h => h.path !== path));
    }

    return { historyStack, pushInStack, removeFromStack }
}

type OfflineStackItem<T = any> = { id: string, member: T }

export const useOfflineStack = <T,>(key: string, initial?: OfflineStackItem<T>[], limit = 20, allowDuplicate?: boolean) => {
    const [stack, setStack] = useOfflineStore<OfflineStackItem<T>[]>(key, initial ?? []);

    const pushInStack = (member: OfflineStackItem<T>) => {
        let tempStack = [...(stack || [])]
        if (tempStack.length >= limit) {
            tempStack.pop();
        }
        if (!allowDuplicate) {
            tempStack = tempStack.filter(h => h.id !== member.id);
        }

        tempStack.push(member);
        setStack(tempStack);
    }

    const removeFromStack = (id: string) => {
        setStack(stack.filter(i => i.id !== id));
    }

    return { stack, pushInStack, removeFromStack, setStack }
}

export const useSearchHistoryStack = <T,>() => useOfflineStack<T>("searchHistoryStack");

export const useChageSearchParams = () => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const addToSearchParams = (values: Record<string, string | number | boolean>) => {
        if (!values) return;
        const keys = Object.keys(values)
        if (!keys.length) return;

        const sp = new URLSearchParams(searchParams);
        keys.forEach(key => {
            sp.set(key, String(values[key]));
        });
        const oldPath = `${pathname}?${searchParams.toString()}`
        const newPath = `${pathname}?${sp.toString()}`
        if (oldPath === newPath) return;
        router.push(newPath);
    }

    const removeFromSearchParams = (keys: string[]) => {
        if (!keys || !keys.length) return;

        const sp = new URLSearchParams(searchParams);
        keys.forEach(key => {
            sp.delete(key);
        });
        const oldPath = `${pathname}?${searchParams.toString()}`
        const newPath = `${pathname}?${sp.toString()}`
        if (oldPath === newPath) return;
        router.push(newPath);
    }

    return { searchParams, pathname, addToSearchParams, removeFromSearchParams }
}