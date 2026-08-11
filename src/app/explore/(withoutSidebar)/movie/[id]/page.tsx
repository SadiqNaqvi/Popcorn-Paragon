import JsonLd from "@components/JsonLd";
import { getUserFromToken } from "@lib/backend/utils";
import { fetchMovie } from "@lib/shared/helpers/external_fetchers";
import { getAllShelvesOfUser, getShelvesForTaleon } from "@lib/shared/helpers/internal_fetchers";
import { getQueryClient, prefetchInfiniteQuery, prefetchQuery } from "@lib/backend/providers/queryClient";
import { generateJsonLdForMovie } from "@lib/shared/seo/jsonld";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { getPoster, getQueryKeys } from "@lib/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";
import { cookies } from "next/headers";
import TaleonPage from "@app/explore/(withoutSidebar)/components/TaleonPage";

export const generateMetadata = async ({ params }: ParloPageProps): Promise<Metadata> => {
    const { id } = await params;
    const data = await fetchMovie(id, false);

    if (!data) return generateDynamicMetadata({});

    const { title, overview, backdrop } = data;

    return generateDynamicMetadata({
        title,
        allowRobots: false,
        description: `${overview} - View cast, crew, ratings, reviews, related communities, thread, shelves, and discussions on Parlocula.`,
        coverImage: backdrop ? getPoster({ path: backdrop, external: true, type: "backdrop", size: "w1280" }) : undefined,
        url: `/explore/movie/${id}`,
    });
};

const MoviePage = async ({ params }: ParloPageProps) => {

    const { id } = await params;

    const queryClient = getQueryClient();

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    const content = await fetchMovie(id, true);

    if (content && user) {
        await Promise.all([
            prefetchQuery({
                queryFn: () => getShelvesForTaleon(content.taleon_id, user.user_id, jar),
                queryKey: getQueryKeys("shelfsForTaleon_cnid", { cnid: content.taleon_id }),
                queryClient,
            }),
            prefetchInfiniteQuery({
                queryFn: () => getAllShelvesOfUser(user.user_id, 1, jar),
                queryKey: getQueryKeys("allShelvesOfUser_uid", { uid: user.user_id }),
                queryClient,
            }),
        ])
    }

    const jsonLd = content ? generateJsonLdForMovie(content) : null;

    return (
        <>
            <JsonLd schemas={jsonLd} />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <TaleonPage content={content} type="movie" />
            </HydrationBoundary>
        </>
    )
};

export default MoviePage;