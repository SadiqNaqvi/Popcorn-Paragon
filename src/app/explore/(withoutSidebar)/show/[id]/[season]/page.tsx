import TaleonWikiHeader, { TaleonWikiSection } from "@app/explore/(withoutSidebar)/components/TaleonWikiPage";
import { ArtistCard, ParloFooter, VerticleMovieCard } from "@components/ui";
import { NotFound } from "@components/fallbacks";
import { fetchSeasonForShow, fetchShow } from "@lib/shared/helpers/external_fetchers";
import { makeUrlSafe } from "@lib/shared/utils";
import { Metadata } from "next";

type Params = { id: string, season: string };
type Props = { params: Promise<Params> };

const fetchSeason = async ({ id, season }: Params, getInternalData: boolean) => {
    const seasonNumber = parseInt(season.split('-')[1]);
    const [showPromise, seasonPromise] = await Promise.all([
        fetchShow(id, getInternalData),
        fetchSeasonForShow(id, isNaN(seasonNumber) ? 1 : seasonNumber),
    ]);
    if (!showPromise || !seasonPromise) return null;
    return { show: showPromise, season: seasonPromise }
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {

    const data = await fetchSeason(await params, false);

    if (!data) return { title: "Parlocula" };
    const { season, show } = data;
    return {
        title: `${season.title} - Parlocula`,
        description: season.overview,
    };
};

const SeasonPage = async ({ params }: Props) => {

    const content = await fetchSeason(await params, true);

    if (!content) return (
        <NotFound
            title="Oops! Looks like the popcorn is missing"
            paras={[
                `Possible reasons: Show id is incorrect.`,
                `Please search the show with its title in the Explore Page`
            ]}
        />
    )

    const { season, show } = content;

    const metadata = [
        { label: 'Rating', value: `${season.rating}/10` },
        { label: 'Year', value: new Date(season.release_date).getFullYear() },
    ]

    return (
        <>

            <TaleonWikiHeader
                backdrop={show.backdrop}
                frameType="poster"
                overviewOrBio={season.overview}
                poster={season.poster}
                title={season.title}
                titleSupport={<p className="text-sm md:text-base ghostColor">{show.tagline}</p>}
                wikiMeta={metadata}
            />
            <TaleonWikiSection heading="Top Cast">
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {season.cast.map(el => (
                        <ArtistCard key={el.id} title={el.name} detail={el.character} img={el.poster} link={`/explore/artist/${el.id}-${makeUrlSafe(el.name)}`} />
                    ))}
                </div>
            </TaleonWikiSection>
            <TaleonWikiSection heading="Episodes">
                <ul className="flex gap-4 overflow-x-auto pb-2">
                    {season.episodes.map(el => (
                        <VerticleMovieCard
                            {...el}
                            redirect={`season-${season.season_number}/episode-${el.episode_number}`}
                            type="show"
                            key={el.id}
                            year={new Date(el.release_date).getFullYear()}
                        />
                    ))}
                </ul>
            </TaleonWikiSection>

            <TaleonWikiSection
                heading="More Like this"
                horizontalMovieListProps={{
                    type: "show",
                    func: "fetchSimilarShows",
                    args: [show.tmdb_id],
                    querykeys: ["similarShows", show.tmdb_id],
                }}
            />

            {season.cast.splice(0, 2).map((el) => (
                <TaleonWikiSection
                    key={el.id}
                    heading={`More of ${el.name}`}
                    moreButton={{
                        path: `/explore/artist/${el.id}`,
                    label:"More Movies"
                    }}
                    horizontalMovieListProps={{
                        type: "movie",
                        func: "fetchMoviesWithCast",
                        args: [el.id],
                        except: show.tmdb_id,
                        querykeys: ["moviesWithCast", el.id],
                    }}
                />
            ))}
            <ParloFooter />
        </>
    )
}

export default SeasonPage;