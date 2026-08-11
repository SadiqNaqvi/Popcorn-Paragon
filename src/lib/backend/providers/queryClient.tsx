import { defaultShouldDehydrateQuery, environmentManager, Query, QueryClient } from "@tanstack/react-query";
import { GeneralGetReturn, GeneralMultipleReturn } from "@type/internal";
import { refineResponseForInfiniteQuery, refineResponseForQuery } from "../../shared/utils";

const createQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 60,
            gcTime: 1000 * 60 * 60,
        },
        dehydrate: {
            // include pending queries in dehydration
            shouldDehydrateQuery: (query: Query) =>
                defaultShouldDehydrateQuery(query) ||
                query.state.status === "pending",
        },
    },
});

let browserQueryClient: QueryClient | undefined = undefined;

export const getQueryClient = () => {
    if (environmentManager.isServer()) return createQueryClient();
    else {
        if (!browserQueryClient) browserQueryClient = createQueryClient();
        return browserQueryClient;
    }
};

type QueryProps<T = unknown> = {
    queryClient: QueryClient,
    queryKey: string[],
    queryFn: () => Promise<GeneralGetReturn<T>>
}

type InfiniteQueryProps<T = unknown> = QueryProps & {
    queryFn: () => Promise<GeneralMultipleReturn<T>>,
    initialPageParam?: number
}

export const fetchQuery = async <T = unknown>({ queryClient, queryFn, queryKey }: QueryProps<T>): Promise<T | null> => {
    try {
        return await queryClient.fetchQuery<T>({
            queryKey,
            queryFn: () => refineResponseForQuery<T>(queryFn) as Promise<T>,
            staleTime: 60 * 60 * 1000,
            gcTime: 60 * 60 * 1000
        });
    } catch (e: any) {
        console.warn("Error occured while fetching content", e.message);
        return null;
    }
}

export const prefetchQuery = ({ queryClient, queryFn, queryKey }: QueryProps) => queryClient.prefetchQuery({
    queryKey,
    queryFn: () => refineResponseForQuery(queryFn),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000
});

export const fetchInfiniteQuery = async  <T = unknown>({ queryClient, queryFn, queryKey, initialPageParam = 1 }: InfiniteQueryProps<T>) => {
    try {
        return await queryClient.fetchInfiniteQuery({
            queryKey,
            queryFn: () => refineResponseForInfiniteQuery(queryFn, initialPageParam) as Promise<T>,
            staleTime: 60 * 60 * 1000,
            gcTime: 60 * 60 * 1000,
            initialPageParam,
        });

    } catch (e: any) {
        console.warn("Error occured while fetching infinite data", e.message);
        return { data: [], total: 0 };
    }
}

export const prefetchInfiniteQuery = ({ queryClient, queryFn, queryKey, initialPageParam = 1 }: InfiniteQueryProps) => queryClient.prefetchInfiniteQuery({
    queryKey,
    queryFn: () => refineResponseForInfiniteQuery(queryFn, initialPageParam),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    initialPageParam,
});