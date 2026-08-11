import Navigate from "@components/Navigate";
import { ShelfItemType } from "@type/internal";
import ParloImage from "./ParloImage/ParloImage";
import MetadataTile, { MetadataTileContainer } from "./MetaDataTile";
import { timeAgo } from "@lib/shared/utils";


type RequiredFields = "poster" | "title" | "year";
type ShelfItemProps = Pick<ShelfItemType, RequiredFields> & Partial<Omit<ShelfItemType, RequiredFields>>;

const ShelfItemContent = ({ poster, title, year, createdAt, added_by, taleon_type }: ShelfItemProps) => (
    <article className="flex items-center gap-3 w-full">
        <ParloImage
            size={64}
            frame={poster}
            frameType="poster"
            alt={`Poster for the ${taleon_type} - ${title}`}
            sizes={[
                { imageWidth: 48, maxScreenWidth: 480 },
                { imageWidth: 64 },
            ]}
            className="size-12 sm:size-16 object-cover rounded-full"
        />
        <div className="space-y-1">
            <h3 className="font-semibold">{title}</h3>
            <MetadataTileContainer>
                <MetadataTile>{year}</MetadataTile>
                <MetadataTile condition={!!createdAt}>{timeAgo(createdAt)}</MetadataTile>
                <MetadataTile condition={!!added_by}>by: @{added_by}</MetadataTile>
            </MetadataTileContainer>
        </div>
    </article>
)

export const ShowOnlyShelfItem = ShelfItemContent;

const ShelfItemBar = (item: ShelfItemType) => {
    const { taleon_type, ext_id, title, poster } = item;
    return (
        <Navigate
            historyPayload={{ title, poster, type: taleon_type }}
            className="w-full"
            goto={`/explore/${taleon_type}/${ext_id}`}
            comp="link"
        >
            <ShelfItemContent {...item} />
        </Navigate>
    )
}

export default ShelfItemBar;