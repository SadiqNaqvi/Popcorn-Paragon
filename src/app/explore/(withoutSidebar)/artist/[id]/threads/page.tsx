import TaleonThreadPage from "@app/explore/(withoutSidebar)/components/TaleonThreadPage";
import { fetchPerson } from "@lib/shared/helpers/external_fetchers";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";

export const generateMetadata = async ({ params }: ParloPageProps): Promise<Metadata> => {
    const id = (await params).id.split('-')[0];

    const data = await fetchPerson(id);
    if (!data) return { title: "Parlocula" };
    return {
        title: `Threads on ${data.name} - Parlocula`,
        description: data.biography,
    }
}

const Page = TaleonThreadPage;

export default Page;