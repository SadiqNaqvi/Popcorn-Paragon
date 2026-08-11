import { defaultShouldDehydrateQuery, environmentManager, Query, QueryClient } from "@tanstack/react-query";

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