import { EyesIcon } from "@assets/Icons";
import { Navigate } from "@components";
import { numberConverter, timeAgo } from "@lib/shared/utils";
import { MereShelf } from "@type/internal";
import { MetadataTile, MetadataTileContainer, ShelfPoster } from "./";

const ShelfBar = ({ _id, item_count, name, poster, shelfKey, isPrivate, shelf_type, createdAt, last_added, saved_count }: MereShelf) => {
    return (
        <Navigate
            key={_id}
            comp="link"
            goto={`/s/${_id}${isPrivate ? `?k=${shelfKey}` : ''}`}
            historyPayload={{
                title: name,
                poster,
                type: "shelf",
            }}
            title={`Visit ${name} - Shelf`}
            aria-label={`Visit ${name} - Shelf`}
        >
            <article className="flex items-center gap-2 p-2 sm:px-4">
                <ShelfPoster iconsClassName="p-2 bg-gray20" name={name} poster={poster} shelf_type={shelf_type} />
                <div className="w-stretch">
                    <h4 className="line-clamp-1 capitalize">{name}</h4>
                    <MetadataTileContainer>
                        <MetadataTile condition={!!isPrivate}>
                            <EyesIcon className="size-4" />
                        </MetadataTile>
                        <MetadataTile condition={!!createdAt}>
                            {timeAgo(createdAt, true)}
                        </MetadataTile>
                        <MetadataTile condition={!!last_added}>
                            Added: {timeAgo(last_added, true)}
                        </MetadataTile>
                        <MetadataTile condition={!!item_count}>
                            {numberConverter(item_count || 0)} items
                        </MetadataTile>
                        <MetadataTile condition={!!saved_count}>
                            Saved by: {numberConverter(saved_count || 0)}
                        </MetadataTile>
                    </MetadataTileContainer>
                </div>
            </article>
        </Navigate>
    )
}

export default ShelfBar;