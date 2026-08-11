import TaleonThreadPage from "@app/explore/(withoutSidebar)/components/TaleonThreadPage";
import { fetchShow } from "@lib/shared/helpers/external_fetchers";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";

export const generateMetadata = async ({ params }: ParloPageProps): Promise<Metadata> => {
    const id = (await params).id.split('-')[0];

    const data = await fetchShow(id, false);
    if (!data) return { title: "Parlocula" };
    return {
        title: `Threads on ${data.title} - Parlocula`,
        description: data.overview,
    }
}

const Page = TaleonThreadPage;

export default Page;