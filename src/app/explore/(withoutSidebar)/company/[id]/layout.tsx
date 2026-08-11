import { TabContainer, TabList } from "@components/ui";
import { NotFound } from "@components/fallbacks";
import TaleonWikiSkeleton from "@components/ui/loading/TaleonWikiSkeleton";
import { fetchCompany } from "@lib/shared/helpers/external_fetchers";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";
import { PropsWithChildren, Suspense } from "react";
import TaleonWikiHeader from "../../components/TaleonWikiPage";

const fetchData = async (params: { id: string }) => {
    const company_id = params.id.split('-')[0];
    return await fetchCompany(company_id);
}

export const generateMetadata = async ({ params }: ParloPageProps): Promise<Metadata> => {

    const awaitedParams = await params;
    const data = await fetchData(awaitedParams);

    if (!data) return generateDynamicMetadata({});

    const { title, description } = data;

    return generateDynamicMetadata({
        title,
        allowRobots: true,
        description,
        url: `/explore/company/${awaitedParams.id}`,
    });
};

const Page = async ({ params, children }: PropsWithChildren<{ params: { id: string } }>) => {

    const content = await fetchData(params);

    if (!content) return (
        <NotFound
            title="Oops! Looks like we could'nt find anything"
            paras={[
                "Possible Reason: The company id is incorrect.",
                "Please try to search the company in the explore page",
            ]} />
    );

    const currentPage = `/explore/company/${content.tmdb_id}`;

    return (
        <>
            <TaleonWikiHeader
                poster={content.poster}
                title={content.title}
                frameType="logo"
                titleSupport={<p className="text-sm md:text-base ghostColor">Situated at: {content.headquarters}</p>}
                overviewOrBio={content.description}
                titleToShare={`Check out some top rated movies from ${content.title} - Parlocula`}
                posterClassName="object-contain rounded-none"
            />

            <TabContainer>
                <TabList href={currentPage}>Movies</TabList>
                <TabList href={currentPage + "/show"}>Shows</TabList>
            </TabContainer>

            {children}
        </>
    )
}

const CompanyLayout = async ({ params, children }: PropsWithChildren<ParloPageProps>) => {
    const awaitedParams = await params;
    const [_, ...title] = awaitedParams.id.split('-');

    return (
        <Suspense fallback={<TaleonWikiSkeleton backdrop title={title.join(' ')} />}>
            <Page params={awaitedParams}>
                {children}
            </Page>
        </Suspense>
    )
}

export default CompanyLayout;