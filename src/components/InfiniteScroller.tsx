"use client";

import { useInfiniteQueryHook } from "@lib/frontend/hooks";
import useCurrentUser from "@store/user";
import { InfiniteData } from "@tanstack/react-query";
import { PaginatedData } from "@type/external";
import { AggregatedResponse, GeneralGetReturn, GeneralMultipleReturn, InfiniteQueryResponse } from "@type/internal";
import { ErrorCodes } from "@type/other";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef } from "react";
import NotFound from "./fallbacks/NotFound";
import { Button, LoadingSpinner, OptionalChildren, ParloFooter } from "./ui";
import { ShowError } from "./fallbacks";
import { twMerge } from "tailwind-merge";

export type InfiniteScrollerProps = {
    Component: React.ComponentType<any>,
    fetchData: (pageParams: number) => Promise<GeneralMultipleReturn | GeneralGetReturn<PaginatedData>>,
    queryKeys: (string | number)[],
    NotFoundSection?: React.ReactNode,
    notFoundMessage?: { title: string, paras: string[] },
    callback?: (arg: any) => any;
    additional?: any;
    initialPage?: number,
    initialData?: { data: any[], total: number } | null,
    Loading?: React.ReactNode,
    className?: string;
    paginate?: boolean;
    placeholderData?: InfiniteQueryResponse<any> | AggregatedResponse<any>
    onSuccess?: (d: InfiniteData<InfiniteQueryResponse<any>, number>) => void,
    enabled?: boolean,
    showFooter?: boolean;
    skipGroupInClassName?: boolean,
}

const defaultClasses = "space-y-2 list-none";

const defaultNotFoundMessages = {
    title: "Oops! Looks like the popcorn is missing",
    paras: ["Please search the resouce using it's name, title, username, etc."],
}

export default function InfiniteScroller({ Loading, showFooter, onSuccess, placeholderData, skipGroupInClassName, Component, fetchData, queryKeys, NotFoundSection, notFoundMessage = defaultNotFoundMessages, initialPage = 1, enabled = true, initialData, callback, className = defaultClasses, paginate = true, additional }: InfiniteScrollerProps) {

    const container = useRef(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { meta, dataSaver, isHydrated } = useCurrentUser();

    const updateSearchParams = (page: number) => {
        if (!paginate) return;
        const params = new URLSearchParams(searchParams);
        params.set("p", page.toString());
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const gotoTop = () => {
        const params = new URLSearchParams(searchParams);
        params.set("p", '1');
        router.replace(`${pathname}?${params.toString()}`)
    }

    const { data, refetch, isLoading, error, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQueryHook({
        queryKeys: queryKeys,
        queryFn: (p) => fetchData(p)
            .then(res => {
                if (paginate && res.success && (("results" in res.result && res.result?.results?.length) || ("data" in res.result && res.result?.data?.length)) && p > 1)
                    updateSearchParams(p)
                return res;
            }),
        initialData,
        initialPage,
        placeholderData,
        onSuccess,
        enable: enabled,
    });

    useEffect(() => {
        // console.log("infiniteScroller", isHydrated, dataSaver);
        if (!isHydrated || dataSaver) return;
        const current = container.current;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isFetchingNextPage && hasNextPage) {
                fetchNextPage();
            }
        }, { threshold: 0.1 })

        if (current && hasNextPage) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        }
    }, [dataSaver, isHydrated, isLoading]);

    const manuallyLoadNextPage = () => {
        fetchNextPage();
    }

    const LoadingComponent = () => {
        return Loading ?? <LoadingSpinner />
    }

    const NotFoundComponent = ({ ActionButton, paras, title }: {
        title: string;
        paras: string[];
        ActionButton?: React.ReactNode;
    }) => {
        if (NotFoundSection === undefined)
            return <NotFound paras={paras} title={title} ActionButton={ActionButton} />
        else return NotFoundSection;
    }

    if (isLoading) return <LoadingComponent />

    else if (error && !(data && data.pages.length)) return (
        <ShowError
            retry={refetch}
            errCode={error.message as ErrorCodes}
            heading="Unable to fetch the resource you're looking for"
        />
    )

    else if (!data?.pages[0]?.results?.length && initialPage !== 1) return (
        <NotFoundComponent
            title="Looks like you came across too far"
            paras={[`No data is available at page ${initialPage}`]}
            ActionButton={(
                <Button
                    id="remove-page-params-button"
                    title="Go To Top"
                    className="primary"
                    onClick={gotoTop}
                >
                    Go to top
                </Button>
            )}
        />
    )

    else if (!data || !data.pages[0]?.total_results)
        return <NotFoundComponent {...notFoundMessage} />

    return (
        <>
            <ol className={twMerge(showFooter ? "h-size-screen" : "", className)} id="infiniteScroller">
                {data.pages.
                    flatMap(page => page.results)
                    .map((content, ind) => (
                        <li key={content.id || content._id || content.tmdb_id || ind} className={skipGroupInClassName ? undefined : "group"}>
                            <Component {...content} callback={callback} additional={additional} user={meta} />
                        </li>
                    ))}
            </ol>
            <OptionalChildren condition={!error} fallback={(
                <ShowError
                    retry={refetch}
                    errCode={error?.message as ErrorCodes}
                    heading="Unable to fetch the resource you're looking for"
                />
            )}>
                <OptionalChildren condition={hasNextPage} fallback={showFooter && <ParloFooter className="mt-auto" />}>
                    <OptionalChildren
                        fallback={(
                            <div className="w-full flex flex-cntr-all">
                                <Button
                                    id="manual-load-button"
                                    title="Load More"
                                    className="primary"
                                    onClick={manuallyLoadNextPage}
                                >
                                    Load More
                                </Button>
                            </div>
                        )}
                        condition={(isHydrated && !dataSaver) || isFetchingNextPage}>
                        <div ref={container} className="mt-4 py-2 w-full">
                            <LoadingComponent />
                        </div>
                    </OptionalChildren>
                </OptionalChildren>
            </OptionalChildren>
        </>
    )
}