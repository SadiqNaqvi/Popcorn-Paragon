import { TaleonGrid } from "@app/explore/(withoutSidebar)/components";
import { fetchPerson } from "@lib/shared/helpers/external_fetchers";
import { ParloPageProps } from "@type/other";

const fetchData = async (params: { id: string }) => {
    const company_id = params.id.split('-')[0];
    return await fetchPerson(company_id);
}

const ArtistAsCrewPage = async ({ params }: ParloPageProps) => {

    const content = await fetchData(await params);

    if (!content) return null;

    return (
        <TaleonGrid content_id={content.tmdb_id} section="crew" data={content.credits.crew} />
    )
}

export default ArtistAsCrewPage;