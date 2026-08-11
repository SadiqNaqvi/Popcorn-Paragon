import { TaleonWikiHeader, TaleonWikiSection, HorizontalThreadList } from "@app/explore/(withoutSidebar)/components";
import { OptionalChildren, ParloFooter, TabContainer, TabList } from "@components/ui";
import { NotFound } from "@components/fallbacks";
import { TaleonWikiSkeleton } from "@components/ui/loading";
import { fetchPerson } from "@lib/shared/helpers/external_fetchers";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";
import { PropsWithChildren, Suspense } from "react";

const fetchData = async (params: { id: string }) => {
    const company_id = params.id.split('-')[0];
    return await fetchPerson(company_id);
}

export const generateMetadata = async ({ params }: ParloPageProps): Promise<Metadata> => {
    const awaitedParams = await params;
    const data = await fetchData(awaitedParams);

    if (!data) return generateDynamicMetadata({});

    const { name, biography } = data;

    return generateDynamicMetadata({
        title: name,
        allowRobots: true,
        description: `${biography.slice(0, 100)} - Discover biography, filmography, related movies, shows, shelves, and community discussions on Parlocula.`,
        url: `/explore/artist/${awaitedParams.id}`,
    });
};

const Page = async ({ params, children }: PropsWithChildren<{ params: { id: string } }>) => {

    const content = await fetchData(params);

    if (!content) return (
        <NotFound
            title="Oops! Looks like The Parlocula Explorers couldn't find anything"
            paras={[
                `Possible reasons: artist id is incorrect`,
                `Please search the artist in the Explore Page`
            ]}
        />
    )

    const currentPage = `/explore/artist/${content.tmdb_id}`;

    return (
        <>
            <TaleonWikiHeader
                poster={content.profile}
                title={content.name}
                frameType="profile"
                titleSupport={<p className="text-sm md:text-base ghostColor">Profession: {content.department}</p>}
                overviewOrBio={content.biography}
                descriptionSupport={(
                    <div className="mt-4 space-y-2 ghostColor text-xs md:text-sm">
                        <p>
                            Born on: {new Date(content.birth).toDateString()}{" "}
                            <OptionalChildren condition={content.place_of_birth}>
                                at {content.place_of_birth}
                            </OptionalChildren>
                        </p>
                        <OptionalChildren condition={content.death}>
                            <p>
                                Died on: {new Date(content.death || 0).toDateString()}
                                <OptionalChildren condition={content.place_of_death}>
                                    at {content.place_of_death}
                                </OptionalChildren>
                            </p>
                        </OptionalChildren>
                    </div>
                )}
            />

            <TaleonWikiSection
                heading="Connected Threads"
                moreButton={{
                    path: `${content.tmdb_id}/threads`,
                    label: "More Threads"
                }}
            >
                <HorizontalThreadList id={content.tmdb_id} type="person" />
            </TaleonWikiSection>

            <TabContainer>
                <TabList href={currentPage}>As Cast</TabList>
                <TabList href={currentPage + "/crew"}>As Crew</TabList>
            </TabContainer>

            {children}
        </>
    )
}

const ArtistPageLayout = async ({ children, params }: PropsWithChildren<ParloPageProps>) => {

    const awaitedParams = await params;
    const [_, ...title] = awaitedParams.id.split('-');

    return (
        <Suspense fallback={<TaleonWikiSkeleton title={title.join(' ')} backdrop={false} />}>
            <Page params={awaitedParams}>{children}</Page>
            <ParloFooter />
        </Suspense>
    )
}

export default ArtistPageLayout;