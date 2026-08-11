"use client";

import { getQueryClient } from '@lib/backend/providers/queryClient';
import React, { useEffect, useRef, useState } from 'react';

type PullToRefreshProps = {
    children: React.ReactNode;
};

export const refreshPage = async () => {
    const queryClient = getQueryClient();

    const queries = queryClient.getQueryCache()
        .getAll()
        .filter(query => query.getObserversCount() > 0)
        .map(q => q.queryKey);

    // console.log(queries);

    await Promise.all(queries.map(query => queryClient.refetchQueries({ queryKey: query })));
}

const minLenthToPull = 60;
const threshold = 160;

export default function PullToRefresh({ children }: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const containerRef = useRef<HTMLElement>(null);

    const startY = useRef<number | null>(null);
    const isPulling = useRef(false);
    const latestDistance = useRef(0);
    const animationFrame = useRef<number | null>(null);

    const updatePullDistance = () => {
        const distance = Math.min(latestDistance.current, threshold * 1.2);
        if (distance > threshold * 1.2) return;
        console.log(distance);
        setPullDistance(distance);
        animationFrame.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
        console.log("yaha aaya");
        if (!isPulling.current || startY.current === null) return;
        const distance = e.touches[0].clientY - startY.current;

        // if (distance > 0 && distance < minLenthToPull) {
        //     // e.preventDefault();
        //     latestDistance.current = distance;
        //     return;
        // }


        if (distance > 0) {
            e.preventDefault();
            latestDistance.current = distance;

            if (animationFrame.current === null) {
                animationFrame.current = requestAnimationFrame(updatePullDistance);
            }
        }
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        } else if (isPulling.current) {
            isPulling.current = false;
        }
    };

    const resetPullState = () => {
        setPullDistance(0);
        latestDistance.current = 0;
        startY.current = null;
        isPulling.current = false;

        if (animationFrame.current !== null) {
            cancelAnimationFrame(animationFrame.current);
            animationFrame.current = null;
        }
    };

    const handleRefreshing = () => {
        const distance = Math.min(latestDistance.current, threshold * 1.2);
        if (distance >= threshold && !refreshing) {
            setRefreshing(true);
            Promise.resolve(refreshPage()).finally(() => {
                setRefreshing(false);
                resetPullState();
            });
        }
        else if (distance > 0) resetPullState();
    }

    const handleTouchEnd = handleRefreshing;

    // const preventDefault = (e: Event) => {
    //     e.preventDefault();
    //     e.stopPropagation();
    // }

    useEffect(() => {
        // if (refreshing) return;
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    const status = refreshing ? "Refreshing!!"
        : pullDistance === 0 ? ''
            : pullDistance < threshold ? "Just a bit more!"
                : "YES, Release it";

    return (
        <main ref={containerRef}>
            <div className='flex flex-cntr-all w-full bg-primarylight' style={{ transition: "height 200ms ease", height: refreshing ? 50 : pullDistance, overflow: "hidden" }}>
                {status}
            </div>
            {children}
        </main>
    );
}
