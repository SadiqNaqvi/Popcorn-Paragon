"use client";

import { Navigate } from "@components";
import { OptionalChildren, ThreadBox } from "@components/ui";
import { ShowError } from "@components/fallbacks";
import { ThreadBoxSkeleton } from "@components/ui/loading";
import { getThreadsForTaleonOrArtist } from "@lib/shared/helpers/internal_fetchers";
import { useQueryHook } from "@lib/frontend/hooks";
import { getQueryKeys } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { MereThread } from "@type/internal";
import { ErrorCodes } from "@type/other";
import { useEffect, useRef, useState } from "react";

const HorizontalThreadList = ({ id, type }: { id: string, type: string }) => {

    const [startLoading, setStartLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const container = useRef(null);

    const { filterContent } = useCurrentUser();

    useEffect(() => {
        const current = container.current;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isVisible) {
                if (entry.intersectionRatio >= 0.2)
                    setStartLoading(true);
                if (entry.intersectionRatio >= 0.5)
                    setIsVisible(true);
            }
        }, { threshold: [0.2, 0.5] })

        if (current)
            observer.observe(current);

        return () => {
            if (current)
                observer.unobserve(current);
        }
    }, [isVisible, setIsVisible]);

    const { refetch, isFetching, error, data } = useQueryHook<{ data: MereThread[] }>({
        enabled: isVisible,
        queryKeys: getQueryKeys("threadsOnTaleonOrArtist_id", { id }),
        queryFn: () => getThreadsForTaleonOrArtist(id, 1, !filterContent),
    });

    if (isFetching || !isVisible) return (
        <div className="flex gap-4 pb-2 overflow-x-hidden" ref={container}>
            <OptionalChildren
                condition={startLoading}
                fallback={<div className="h-64 w-full"></div>}
            >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(el => (
                    <ThreadBoxSkeleton key={el} />
                ))}
            </OptionalChildren>
        </div>
    )

    else if (error) return (
        <ShowError
            heading="Oops Looks like we couldn't proceed"
            errCode={error.message as ErrorCodes}
            retry={refetch}
        />
    )

    else if (!data || !data?.data?.length) return (
        <section>
            <div className="py-4 w-full border-dashed border-zinc-500 space-x-4">
                <p className="text-lg text-center">Nothing could be found</p>
                <p className="text-sm text-center">Be the first one to create a thread on this {type}.</p>
            </div>
            <Navigate comp="link" goto={`/new/thread?cnid=${id}&type=${type}`} className="mt-4 btn secondary w-full sm:w-fit">Create Thread</Navigate>
        </section>
    );

    return (
        <section>
            <div className="flex gap-4 pb-2 overflow-x-auto">
                {data.data.map(el => <ThreadBox key={el._id} {...el} />)}
            </div>

            <Navigate comp="link" goto={`/new/thread?cnid=${id}&type=${type}`} className="mt-4 btn secondary w-full sm:w-fit">Create Thread</Navigate>
        </section>
    )
}

export default HorizontalThreadList;