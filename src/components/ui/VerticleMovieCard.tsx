import Navigate from "@components/Navigate";
import { makeUrlSafe } from "@lib/shared/utils";
import { RefinedGeneralData } from "@type/external";
import { twMerge } from "tailwind-merge";
import ParloImage from "./ParloImage/ParloImage";

export default function VerticleMovieCard({ id, type, poster, title, year, rating, redirect, className }: RefinedGeneralData & { redirect?: string, className?: string }) {
    const link = redirect ?? `/explore/${type}/${id}-${makeUrlSafe(title)}`;
    return (
        <Navigate
            historyPayload={{ title, poster, type: type }}
            key={link}
            comp="link"
            goto={link}
        >
            <figure className={twMerge("min-w-44 w-44 relative cursor-pointer", className)}>

                <ParloImage
                    frame={poster}
                    frameType="poster"
                    className="absolute inset-0 size-full"
                    size={176}
                    fill
                    alt={`Poster of ${title}`}
                    containerClassName="relative w-full h-auto aspect-[2/3] object-cover" />

                <figcaption className="absolute text-zinc-200 *:px-2 inset-0 fade-effect flex flex-col justify-end">
                    <h3 className="font-bold line-clamp-2 text-wrap">{title}</h3>
                    <div className="flex flex-cntr-between my-1">
                        <span className="text-xs">{year}</span>
                        <span className="text-xs px-2 py-1 rounded-md bg-gray20">{rating}/10</span>
                    </div>
                </figcaption>

            </figure>
        </Navigate>
    )
}