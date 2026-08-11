import { TaleonGrid } from "@app/explore/(withoutSidebar)/components";
import JsonLd from "@components/JsonLd";
import { fetchPerson } from "@lib/shared/helpers/external_fetchers";
import { generateJsonLdForArtist } from "@lib/shared/seo/jsonld";
import { ParloPageProps } from "@type/other";

const fetchData = async (params: { id: string }) => {
    const company_id = params.id.split('-')[0];
    return await fetchPerson(company_id);
}

const ArtistAsCastPage = async ({ params }: ParloPageProps) => {

    const content = await fetchData(await params);

    if (!content) return null;

    const jsonLd = generateJsonLdForArtist(content);

    return (
        <>
            <JsonLd schemas={jsonLd} />
            <TaleonGrid content_id={content.tmdb_id} section="cast" data={content.credits.cast} />
        </>
    )
}

export default ArtistAsCastPage;