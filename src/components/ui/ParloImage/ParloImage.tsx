import { CollectionIcon, GroupIcon, ImageIconFill, UserWithoutCircleIcon } from "@assets/Icons";
import { convertByteIntoSize } from "@lib/frontend/helpers/media";
import { getPoster } from "@lib/shared/utils";
import { Frame } from "@type/internal";
import { ExternalImageType } from "@type/other";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import OptionalChildren from "../OptionalChildren";
import ExternalImage from "./ExternalImage";
import { getFancyAttributes, ImageSize, InternalFrameType, ParloImageFrameType, turnSizesArrIntoString } from "./utils";
import ImageWrapper from "./ImageWrapper";
import { decodeHash } from "@lib/shared/helpers/thumb_hash";

export type ParloImageProps = {
    className?: string,
    containerClassName?: string,
    classNameForFallback?: string;
    commonClassName?: string;
    height?: number,
    width?: number,
    size?: number,
    alt?: string,
    prioritize?: boolean,
    frame: string | Frame | undefined;
    frameType: ExternalImageType | InternalFrameType;
    fullSizeFrame?: string;
    fancyGallery?: string | true;
    fileNameToDownload?: string;
    fill?: boolean,
    sizes?: ImageSize[];
    showMediaType?: boolean;
    showSourceIcon?: boolean;
    showSize?: boolean;
}

const FallbackIcon = ({ type, className }: { type: ParloImageFrameType, className?: string; }) => {
    if (type === "shelfPoster") return <CollectionIcon className={twMerge("w-full h-auto max-w-10", className)} />
    else if (type === "groupPoster") return <GroupIcon className={twMerge("w-full h-auto max-w-10", className)} />
    else if (type === "userProfile") return <UserWithoutCircleIcon className={twMerge("w-full h-auto max-w-10", className)} />
    else return <ImageIconFill className={twMerge("w-full h-auto max-w-10", className)} />
}

const iconClassName = "size-6 showShadow text-zinc-200";

const ParloImage = ({ frame, alt, height, size, width, className, containerClassName, fullSizeFrame, sizes, classNameForFallback, fill, commonClassName, prioritize, fancyGallery, frameType, fileNameToDownload, showMediaType, showSize, showSourceIcon }: ParloImageProps) => {

    if (!frame) return (
        <div className={twMerge("p-2 bg-gray10 flex flex-cntr-all overflow-hidden", fill ? '' : "w-fit", containerClassName)}>
            <FallbackIcon
                type={frameType}
                className={twMerge(commonClassName, classNameForFallback)}
            />
        </div>
    )

    const isTmdbImage = typeof frame === "string";
    const source = isTmdbImage ? frame : frame.path;

    const correctWidth = width || size || 50;
    const correctHeight = height || size || 50;

    if (isTmdbImage) return (
        <ImageWrapper containerClassName={containerClassName} fill={fill}>
            <ExternalImage
                src={source}
                alt={alt}
                height={correctHeight}
                width={correctWidth}
                className={className}
                sizes={sizes}
                fill={fill}
                commonClassName={commonClassName}
                prioritize={prioritize}
                fancyGallery={fancyGallery}
                frameType={frameType}
                fileNameToDownload={fileNameToDownload}
            />
        </ImageWrapper>
    )

    return (
        <ImageWrapper containerClassName={containerClassName} fill={fill}>
            <Image
                height={fill ? undefined : correctHeight}
                width={fill ? undefined : correctWidth}
                src={getPoster({ path: source, extSource: frame.extSource })}
                loading={prioritize ? "eager" : "lazy"}
                fetchPriority={prioritize ? "high" : "low"}
                alt={alt || ""}
                fill={fill}
                className={twMerge(`cursor-pointer`, commonClassName, className)}
                blurDataURL={frame.hash ? decodeHash(frame.hash) : undefined}
                placeholder={frame.hash ? "blur" : "empty"}
                {...getFancyAttributes({ frameType, fancyGallery, fileNameToDownload, fullSizeFrame }, source)}
                decoding={prioritize ? "sync" : "async"}
                sizes={sizes ? turnSizesArrIntoString(sizes) : `${correctWidth}px`}
            />
            <OptionalChildren condition={showSize || showMediaType || showSourceIcon}>
                <div className="absolute bottom-4 right-4 flex gap-1 items-center text-zinc-200">
                    <OptionalChildren condition={showSize && frame.size}>
                        <span className="px-2 py-1 bg-black/50 text-sm rounded-md">{convertByteIntoSize(frame.size)}</span>
                    </OptionalChildren>
                    <OptionalChildren condition={showMediaType}>
                        <ImageIconFill className={iconClassName} />
                    </OptionalChildren>
                </div>
            </OptionalChildren>
        </ImageWrapper>
    )
}

export default ParloImage;