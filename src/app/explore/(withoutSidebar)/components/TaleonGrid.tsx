"use client";

import { InfiniteScroller } from "@components";
import { VerticleMovieCard } from "@components/ui";
import { fetchMoviesWithCompany, fetchMoviesWithNetwork, fetchShowsWithCompany, fetchShowsWithNetwork } from "@lib/shared/helpers/external_fetchers";
import { PaginatedData, PersonWork, RefinedGeneralData, SortOptions } from "@type/external";
import { GeneralGetReturn } from "@type/internal";

type Sections = "movies_company" | "movies_network" | "shows_company" | "shows_network"

type Props = {
    section: "cast" | "crew" | "collection" | Sections,
    content_id: string,
    data?: (PersonWork | RefinedGeneralData)[],
}

const funcMap: Record<Sections, (id: string, page?: number, sort_by?: SortOptions)
    => Promise<PaginatedData<RefinedGeneralData> | undefined>> =
{
    movies_company: fetchMoviesWithCompany,
    shows_company: fetchShowsWithCompany,
    movies_network: fetchMoviesWithNetwork,
    shows_network: fetchShowsWithNetwork,
}

const Component = (data: RefinedGeneralData) => (
    <VerticleMovieCard {...data} className="w-auto min-w-auto" />
)

const TaleonGrid = ({ section, data, content_id }: Props) => {

    const functionToFetch = async (p: number): Promise<GeneralGetReturn> => {
        if (section === "cast" || section === "crew" || section === "collection")
            return { success: true, result: [] };
        const func = funcMap[section];
        const data = await func(content_id, p);
        if (data) return { success: true, result: data };
        return { success: false, errCode: "unstable_internet" }
    }

    const notFoundReasons = (): string => {
        switch (section) {
            case "cast": return "Looks like this person has never worked as a cast.";
            case "crew": return "Looks like this person has never worked as a crew member.";
            case "movies_company": return "Looks like this company has never produced a movie.";
            case "shows_company": return "Looks like this company has never produced a show.";
            case "movies_network": return "Looks like this netwrok has never produced a movie.";
            case "shows_network": return "Looks like this network has never produced a show.";
            default: return "";
        }
    }

    const NotFoundSection = (
        <div className="forceCenter flex-col">
            <h4 className="text-lg">Nothing could be found.</h4>
            <p className="text-sm">{notFoundReasons()}</p>
        </div>
    )

    return (
        <section className="mt-4 space-y-4">
            <InfiniteScroller
                className="grid grid-cols-2 sm:grid-cols-4 xs:grid-cols-3 gap-2 sm:gap-4 px-2 sm:px-4"
                Component={Component}
                fetchData={functionToFetch}
                queryKeys={["TaleonGrid", "explore", section, content_id]}
                initialData={data ? { data, total: data.length } : undefined}
                initialPage={1}
                NotFoundSection={NotFoundSection}
            />
        </section>
    )
}

export default TaleonGrid;