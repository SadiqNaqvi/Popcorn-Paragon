"use client";

import { queryFilters } from "@lib/shared/constants";
import { QueryFilterType } from "@type/other";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

type Props = ({
    type: QueryFilterType,
    filters?: undefined,
    onActive?: undefined,
    className?: string,
    containerClassName?: string;
} | {
    type: "custom",
    className?: string,
    containerClassName?: string;
    onActive?: string,
    filters: { id: string, label: string }[]
})

const FilterTiles = ({ type, className, filters, onActive, containerClassName }: Props) => {
    const router = useRouter();
    const params = useSearchParams();
    const filterParam = params.get("f") || '';
    const pathname = usePathname();
    const availableFilters = type === "custom" ? filters : queryFilters[type].map(el => ({ id: el, label: el }));
    const currentFilter = availableFilters.find(filter => filter.id === filterParam)?.id ?? availableFilters[0].id;

    const updateFilter = (filterId: string) => {
        if (params.get('f') === filterId) return;
        const urlParams = new URLSearchParams(params.toString());
        filterId ? urlParams.set('f', filterId) : urlParams.delete('f');
        router.replace(pathname + '?' + urlParams.toString());
    }

    return (
        <ul className={twMerge("flex gap-2 overflow-x-auto noScroll", containerClassName)}>
            {availableFilters.map(({ id, label }) => (
                <li
                    key={id}
                    onClick={() => updateFilter(id)}
                    className={twMerge("py-2 px-3 bg-gray20 rounded-2xl cursor-pointer text-sm capitalize min-w-fit", currentFilter === id ? onActive ?? "bg-secondary color-primary" : "", className)}>
                    {label.replaceAll('_', ' ')}
                </li>
            ))}
        </ul>
    )
}

export default FilterTiles;