import { ShelfMutation } from "@components/form/Mutation";
import { getUserFromToken } from "@lib/backend/utils";
import { fetchCollection } from "@lib/shared/helpers/external_fetchers";
import { getTaleon } from "@lib/shared/helpers/internal_fetchers";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { ParloPageProps } from "@type/other";
import { TaleonSchemaType } from "@type/schemas";
import { cookies } from "next/headers";

type SearchParams = { extid: string, type: string, clid: string };

const getTaleonsToStoreInShelf = async ({ clid, extid, type }: Partial<SearchParams>): Promise<TaleonSchemaType[]> => {

    if (extid && type && (type === "movie" || type === "show")) {
        const taleon = await getTaleon(extid, type);
        if (!taleon) return [];

        const { title, year, ext_id, poster, taleon_id, taleon_type } = taleon;
        return [{ ext_id, poster, taleon_type, title, year, taleon_id }]

    } else if (clid) {
        const collection = await fetchCollection(clid);
        if (collection) return collection.parts.map(({ id, poster, title, type, year }) => ({
            ext_id: id, poster, taleon_type: type, title, year, taleon_id: undefined
        }));
    }

    return [];

}

export const metadata = generateDynamicMetadata({ title: "Create New Shelf" });

const CreateShelfPage = async ({ searchParams }: ParloPageProps<any, SearchParams>) => {

    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return;

    const sp = await searchParams;
    const taleons = await getTaleonsToStoreInShelf(sp);

    return (
        <ShelfMutation isEditing={false} taleons={taleons} />
    )

}

export default CreateShelfPage;