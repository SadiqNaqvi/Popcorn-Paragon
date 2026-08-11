import { TaleonWikiHeader, TaleonWikiSection } from "@app/explore/(withoutSidebar)/components";
import { ArtistCard, ParloFooter } from "@components/ui";
import { NotFound } from "@components/fallbacks";
import { fetchEpisodeForSeason, fetchShow } from "@lib/shared/helpers/external_fetchers";
import { makeUrlSafe } from "@lib/shared/utils";
import { ParloPageProps } from "@type/other";
import { Metadata } from "next";

type Ids = { id: string, season: string, episode: string }

const fetchEpisode = async ({ id, episode, season }: Ids, getInternalData: boolean) => {
    const refineSeason = parseInt(season.split('-')[1]);
    const seasonNumber = isNaN(refineSeason) ? 1 : refineSeason;

    const refineEpisode = parseInt(episode.split('-')[1]);
    const episodeNumber = isNaN(refineEpisode) ? 1 : refineEpisode;
    const [showPromise, episodePromise] = await Promise.all([
        fetchShow(id, getInternalData),
        fetchEpisodeForSeason(id, seasonNumber, episodeNumber),
    ]);
    if (!showPromise || !episodePromise) return null;
    return { show: showPromise, episode: episodePromise }
}

export const generateMetadata = async ({ params }: ParloPageProps<Ids>): Promise<Metadata> => {

    const data = await fetchEpisode(await params, false);

    if (!data) return { title: "Parlocula" };
    const { episode, show } = data;
    return {
        title: `${episode.title} (S${episode.season_number}/E${episode.episode_number}) of ${show.title} - Parlocula`,
        description: episode.overview,
    };
};

const EpisodePage = async ({ params }: ParloPageProps<Ids>) => {

    const data = await fetchEpisode(await params, true);

    if (!data) return (
        <NotFound
            title="Oops! Looks like the popcorn is missing"
            paras={[
                "Possible reasons: Show id is incorrect.",
                "Please search the show with its title in the Explore Page"
            ]}
        />
    )

    const { episode, show } = data;

    const metadata = [
        { label: 'Rating', value: `${episode.rating}/10` },
        { label: 'Year', value: new Date(episode.release_date).getFullYear() },
    ]

    return <>

        <TaleonWikiHeader
            backdrop={show.backdrop}
            overviewOrBio={episode.overview}
            poster={episode.poster}
            frameType="poster"
            title={episode.title}
            titleSupport={<p className="text-sm md:text-base ghostColor">{show.tagline}</p>}
            wikiMeta={metadata}
        />

        <TaleonWikiSection heading="Top Cast">
            <div className="flex gap-4 overflow-x-auto pb-2">
                {episode.cast.map(el => (
                    <ArtistCard key={el.id} title={el.name} detail={el.character} img={el.poster} link={`/explore/artist/${el.id}-${makeUrlSafe(el.name)}`} />
                ))}
            </div>
        </TaleonWikiSection>

        <TaleonWikiSection
            heading="More Like This"
            horizontalMovieListProps={{
                type: "show",
                func: "fetchSimilarShows",
                args: [show.tmdb_id],
                querykeys: ["similarShows", show.tmdb_id],
            }}
        />

        {episode.cast.splice(0, 2).map((el) => (
            <TaleonWikiSection
                heading={`More of ${el.name}`}
                moreButton={{
                    path: `/explore/artist/${el.id}`,
                    label: "More Movies"
                }}
                key={el.id}
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
}

export default EpisodePage;