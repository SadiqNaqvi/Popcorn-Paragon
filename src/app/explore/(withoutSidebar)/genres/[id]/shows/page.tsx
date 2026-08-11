"use client"

import InfiniteScroller from "@components/InfiniteScroller";
import { VerticleMovieCard } from "@components/ui";
import { VerticalTaleonCardSkeletonList } from "@components/ui/loading";
import { fetchShowsWithGenres } from "@lib/shared/helpers/external_fetchers";
import { RefinedGeneralData } from "@type/external";
import { useParams } from "next/navigation";

const Component = ({ id, poster, rating, title, year, type }: RefinedGeneralData) => (
    <VerticleMovieCard
        id={id}
        type={type}
        poster={poster}
        title={title}
        rating={rating}
        year={year}
        key={id}
        className="w-auto min-w-auto"
    />
)

const containerClassName = "grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 justify-center";

export default function Page() {
    const { id } = useParams() as { id: string };
    return (
        <section>
            <InfiniteScroller
                Component={Component}
                Loading={<VerticalTaleonCardSkeletonList />}
                fetchData={(page) => fetchShowsWithGenres({ page, genre: id, sort_by: "popularity" })}
                queryKeys={["showsByGenres", id]}
                className={containerClassName}
            />
        </section>
    )
}