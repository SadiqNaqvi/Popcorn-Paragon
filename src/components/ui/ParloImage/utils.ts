import { ExternalImageType } from "@type/other";
import { ParloImageProps } from "./ParloImage";
import { backdrop_sizes, logo_sizes, poster_sizes, profile_sizes, still_sizes } from "@lib/shared/constants";
import { getPoster, isEqual } from "@lib/shared/utils";
import { ExternalImageTypeToSizeMap } from "@type/other";

export type InternalFrameType = "groupPoster" | "shelfPoster" | "userProfile";
export type ParloImageFrameType = ExternalImageType | InternalFrameType;

export type ImageSize = { maxScreenWidth?: number, imageWidth: number | string };

export const turnSizesArrIntoString = (sizes: ImageSize[]) => {
    return sizes
        .sort((a, b) => Number(a.imageWidth) - Number(b.imageWidth))
        .map(
            ({ imageWidth, maxScreenWidth }) => `${maxScreenWidth ? `(max-width: ${maxScreenWidth}px) ` : ''}${imageWidth}${typeof imageWidth === "string" ? '' : "px"}`)
        .join(', ')
}

const getTmdbSizeSet = (type: ExternalImageType) => {
    switch (type) {
        case "backdrop": {
            return backdrop_sizes;
        }
        case "logo": {
            return logo_sizes
        }
        case "poster": {
            return poster_sizes
        }
        case "profile": {
            return profile_sizes
        }
        case "still": {
            return still_sizes
        }
    }
}

const isInternalFrame = (type: ParloImageFrameType): type is Extract<ParloImageFrameType, "userProfile" | "groupPoster"> => {
    return isEqual(type, "userProfile", "groupPoster");
}

export const getTmdbSourceSet = (src: string, type: ParloImageFrameType) => {
    if (isInternalFrame(type)) return '';
    const extType = type === "shelfPoster" ? "poster" : type;

    const set = getTmdbSizeSet(extType);

    const widthToSizeMap: Record<number, ExternalImageTypeToSizeMap[typeof extType]> = set
        .filter(size => size !== "original")
        .reduce((prev, size) => ({ ...prev, [Number(size.slice(1))]: size }), {});

    return Array.from(Object.keys(widthToSizeMap))
        .sort()
        .map(key => {
            const size = widthToSizeMap[Number(key)];

            const image = getPoster({ path: src, external: true, size, type: extType });

            return `${image} ${key}w`
        }).join(', ');
}

export const getFancyAttributes = (config: Pick<ParloImageProps, "fancyGallery" | "fileNameToDownload" | "frameType" | "fullSizeFrame">, src: string | undefined) => {
    const { fileNameToDownload, fancyGallery, frameType, fullSizeFrame } = config;
    if (!fancyGallery || !src) return {};
    const source = fullSizeFrame || (isInternalFrame(frameType) ? src : getPoster({ external: true, type: frameType, size: "original", path: src }));

    return {
        "data-src": source,
        "parlo-gallery": typeof fancyGallery === "string" ? fancyGallery : undefined,
        "data-frame": fancyGallery || true,
        "data-download-src": fileNameToDownload ? source : undefined,
        "data-download-filename": fileNameToDownload,
    }
}