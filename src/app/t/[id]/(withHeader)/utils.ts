import { availablePostCategories } from "@lib/shared/constants";
import { getPostsOfThread } from "@lib/shared/helpers/internal_fetchers";
import { prefetchInfiniteQuery } from "@lib/backend/providers/queryClient";
import {
  getQueryKeys,
  isValidParloId,
  refineSearchParams
} from "@lib/shared/utils";
import { QueryClient } from "@tanstack/react-query";

export const contentFetcher = async ({
  queryClient,
  searchParams,
  id,
  section,
  allowNsfw,
}: {
  queryClient: QueryClient;
  searchParams: { p?: string; f?: string; c?: string };
  id: string;
  allowNsfw: boolean,
  section: "posts" | "frames" | "links";
}) => {

  const { filter, page } = refineSearchParams("posts", searchParams.p, searchParams.f);

  const tid = id.split("-")[0];
  if (tid && !isValidParloId(tid)) return null;

  const category = searchParams.c && availablePostCategories.includes(searchParams.c) ? searchParams.c : undefined;

  await prefetchInfiniteQuery({
    queryKey: getQueryKeys("postsOfThread_tid_filter_category", {
      tid,
      filter,
      category: category || "none",
    }),
    queryClient,
    queryFn: () => getPostsOfThread(tid, page, allowNsfw, filter, section, category),
    initialPageParam: page,
  });

  return { filter, page, category, tid };
};
