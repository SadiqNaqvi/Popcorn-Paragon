import { makeUrlSafe } from "@lib/shared/utils";
import { RefinedSearchData } from "@type/external";
import { twMerge } from "tailwind-merge";
import Navigate from "../Navigate";
import ParloImage from "./ParloImage/ParloImage";

export default function SearchTile({ id, image, media_type, name }: RefinedSearchData) {

    const mediaFilter = media_type === "person" ? "profile" : media_type === "movie" || media_type === "show" ? "poster" : "logo";

    return (
        <article className="w-full">
            <Navigate
                comp="link"
                className="h-full w-full flex gap-2 items-center"
                goto={`/explore/${media_type === "tv" ? "show" : media_type}/${id}-${makeUrlSafe(name)}`}
                historyPayload={{
                    title: name,
                    poster: image,
                    type: media_type === "tv" ? "show" : media_type === "person" ? "artist" : "movie"
                }}
            >
                <ParloImage
                    frame={image}
                    frameType={mediaFilter}
                    className={twMerge("w-12 md:w-16 object-center aspect-square", media_type === "person" ? "rounded-full object-cover " : media_type === "company" ? "object-contain" : "rounded-md object-cover")}
                    size={80}
                    alt={`Poster of the ${media_type} - ${name}`}
                />
                <div className="flex-1 space-y-1">
                    <h4 className="sm:text-xl font-semibold line-clamp-1">{name}</h4>
                    <span className="text-xs sm:text-sm capitalize">{media_type === "tv" ? "show" : media_type}</span>
                </div>
            </Navigate>
        </article>
    )
}