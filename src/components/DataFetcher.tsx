"use client";

import { fetchMoviesWithCast, fetchMoviesWithCompany, fetchMoviesWithGenres, fetchMoviesWithYear, fetchShowsWithGenres, fetchSimilarMovies, fetchSimilarShows, fetchTrendingMovies, fetchTrendingShows } from "@lib/shared/helpers/external_fetchers";
import { useQueryHook } from "@lib/frontend/hooks";
import { RefinedGeneralData } from "@type/external";
import { GeneralGetReturn } from "@type/internal";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { VerticalTaleonCardSkeletonList } from "./ui/loading";
import VerticleMovieCard from "./ui/VerticleMovieCard";
import { Button } from "./ui";

export type AllowedFunctionsForHorizontalList =
    | "fetchMoviesWithCast"
    | "fetchMoviesWithCompany"
    | "fetchMoviesWithGenres"
    | "fetchMoviesWithYear"
    | "fetchSimilarMovies"
    | "fetchShowsWithGenres"
    | "fetchSimilarShows"
    | "fetchTrendingMovies"
    | "fetchTrendingShows";


const funcMap = {
    fetchMoviesWithCast,
    fetchMoviesWithCompany,
    fetchMoviesWithGenres,
    fetchMoviesWithYear,
    fetchSimilarMovies,
    fetchShowsWithGenres,
    fetchSimilarShows,
    fetchTrendingMovies,
    fetchTrendingShows,
}

type FuncMap = typeof funcMap

export type HorizontalMovieListProps<T extends AllowedFunctionsForHorizontalList> = {
    func: T,
    args: Parameters<FuncMap[T]>,
    type: string,
    className?: string,
    except?: string,
    querykeys: string[],
}

const DataFetcher = <T extends AllowedFunctionsForHorizontalList>({ func, args, type, className = '', querykeys, except }: HorizontalMovieListProps<T>) => {

    const [isVisible, setIsVisible] = useState(false);
    const container = useRef(null);

    useEffect(() => {

        const current = container.current;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isVisible && entry.intersectionRatio >= 0.2)
                setIsVisible(true);
        }, { threshold: [0.2] })

        if (current) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        }
    }, []);

    const queryFn = async (): Promise<GeneralGetReturn> => {
        const functionToFetch = funcMap[func] as (...args: any) => any;

        const response = await functionToFetch(...args);

        if (!response) return { success: false, errCode: "unstable_internet" };

        let contents = ("results" in response ? response.results : response.result?.results) || [];
        if (except)
            contents = contents.filter((el: any) => String(el.id) !== except)

        return {
            success: true,
            result: contents
        };
    }

    const { refetch, isRefetching, isFetching, error, data } = useQueryHook<RefinedGeneralData[]>({
        enabled: isVisible,
        queryKeys: querykeys,
        queryFn,
    });

    if (!isVisible) return (
        <div ref={container} className="h-64 w-full"></div>
    );

    else if (isFetching || isRefetching) return (
        <VerticalTaleonCardSkeletonList />
    )

    else if (error || !data)
        return (
            <section className="py-4 w-full space-y-4">
                <p className="text-lg text-center">Something Went Wrong! Please Try again</p>
                <Button
                    id="refetch-button"
                    title="Try Again"
                    className="secondary mx-auto"
                    onClick={() => refetch()}
                >
                    Try again
                </Button>
            </section>
        )

    return (
        <ul className={twMerge("flex gap-4 pb-2 overflow-x-auto", className)}>
            {data.slice(0, 20).map((content: RefinedGeneralData) => (
                <li key={content.id}>
                    <VerticleMovieCard {...content} />
                </li>
            ))}
        </ul>
    )
}

export default DataFetcher;