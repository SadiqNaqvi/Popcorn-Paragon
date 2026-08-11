import { ThreadMutation } from "@components/form/Mutation";
import { getUserFromToken } from "@lib/backend/utils";
import { fetchMovie, fetchPerson, fetchShow } from "@lib/shared/helpers/external_fetchers";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { ThreadConnection } from "@type/internal";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";

type SearchParams = { cnid: string, type: ThreadConnection["type"] };

const getConntection = async ({ cnid, type }: Partial<SearchParams>): Promise<ThreadConnection | undefined> => {

    if (!type || !cnid || !(type === "person" || type === "movie" || type === "show"))
        return;

    else if (type === "person") {
        const content = await fetchPerson(cnid);
        if (!content) return;
        const { name, tmdb_id } = content;
        return { name, extid: tmdb_id, type }
    }

    else if (type === "movie") {
        const content = await fetchMovie(cnid, false);
        if (!content) return;
        const { title, tmdb_id } = content;
        return { name: title, extid: tmdb_id, type }
    }

    const content = await fetchShow(cnid, false);
    if (!content) return;
    const { title, tmdb_id } = content;
    return { name: title, extid: tmdb_id, type }
}

export const metadata = generateDynamicMetadata({ title: "Create New Thread" });

const CreateThreadPage = async ({ searchParams }: ParloPageProps<any, SearchParams>) => {
    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return;

    const sp = await searchParams;

    const connection = await getConntection(sp);

    return (
        <ThreadMutation
            isEditing={false}
            defaultValues={connection ? {
                connections: [connection],
                name: connection.name,
            } : undefined} />
    )


}

export default CreateThreadPage;