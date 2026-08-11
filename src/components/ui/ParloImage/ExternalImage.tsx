import { getPoster } from "@lib/shared/utils";
import { ExternalImageType } from "@type/other";
import { twMerge } from "tailwind-merge";
import { ParloImageProps } from "./ParloImage";
import { getFancyAttributes, getTmdbSourceSet, turnSizesArrIntoString } from "./utils";

const ExternalImage = ({
    fill, height, width, src, prioritize, frameType, alt, className, commonClassName, fancyGallery, fileNameToDownload, sizes
}: Pick<ParloImageProps, "fill" | "height" | "width" | "prioritize" | "frameType" | "alt" | "className" | "commonClassName" | "fancyGallery" | "fileNameToDownload" | "sizes"> & { src: string }
) => {

    return (
        <img
            height={fill ? undefined : height}
            width={fill ? undefined : width}
            src={getPoster({ path: src, type: frameType as ExternalImageType, external: true, size: "original" })}
            loading={prioritize ? "eager" : "lazy"}
            fetchPriority={prioritize ? "high" : "low"}
            alt={alt}
            srcSet={getTmdbSourceSet(src, frameType)}
            className={twMerge("cursor-pointer", commonClassName, className)}
            draggable={false}
            {...getFancyAttributes({ frameType, fancyGallery, fileNameToDownload }, src)}
            decoding={prioritize ? "sync" : "async"}
            sizes={sizes ? turnSizesArrIntoString(sizes) : `${width}px`}
        />
    )

}

export default ExternalImage;