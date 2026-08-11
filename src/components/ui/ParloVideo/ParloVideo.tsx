"use client";

import { PlayIcon, VimeoIcon, YoutubeIcon } from "@assets/Icons";
import { OptionalChildren, VideoPlayer } from "@components/ui";
import { Fancybox } from "@fancyapps/ui";
import { formatTimeAsDuration } from "@lib/frontend/helpers/media";
import { decodeHash } from "@lib/shared/helpers/thumb_hash";
import { addProxyForFrames } from "@lib/shared/utils";
import { Frame } from "@type/internal";
import Image from "next/image";
import { SyntheticEvent, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

const iconClassName = "size-6 showShadow text-zinc-200";

const isEmbeddingFrame = (source: Frame["extSource"]) => {
    return !!(source === "vimeo" || source === "youtube")
}

const getSource = (path: string, source: Frame["extSource"]) => {
    if (source === "web")
        return addProxyForFrames(path);
    return path;
}

const SourceIconMap = ({ extSource }: Pick<Frame, "extSource">) => {
    if (extSource === "vimeo")
        return <VimeoIcon className={iconClassName} />
    else if (extSource === "youtube")
        return <YoutubeIcon className={iconClassName} />
    else return <PlayIcon className={iconClassName} />
}

type Props = {
    className?: string,
    containerClassName?: string,
    frame: Frame,
    disablePopup?: boolean,
    galleryId?: string,
    alt: string,
    skipSourceIcon?: boolean;
    hideDuraion?: boolean;
}

const ParloVideo = ({ className, containerClassName, frame, disablePopup, galleryId, alt, skipSourceIcon, hideDuraion }: Props) => {

    const [duration, setDuration] = useState(frame.duration ? formatTimeAsDuration(frame.duration) : '');
    const [play, setPlay] = useState(false);
    const videoContainer = useRef<HTMLDivElement | null>(null);

    const handleDuration = (e: SyntheticEvent<HTMLVideoElement, Event>) => {
        if (hideDuraion || duration) return;
        setDuration(formatTimeAsDuration((e.target as HTMLVideoElement).duration));
    }

    const handleClick = () => {
        if (disablePopup || !videoContainer.current) return;
        setPlay(true);
        Fancybox.show([{
            src: `#${videoContainer.current.id}`,
        }], {
            on: {
                "close": () => {
                    setPlay(false);
                }
            },
            closeButton: false
        })
    }

    const path = getSource(frame.path, frame.extSource);

    const embeddingFrame = isEmbeddingFrame(frame.extSource);
    const allowAttributePopup = !disablePopup && embeddingFrame;
    const allowProgramaticallyPopup = !disablePopup && !embeddingFrame;

    return (
        <>
            <div
                data-frame={allowAttributePopup ? galleryId || true : undefined}
                data-src={allowAttributePopup ? frame.path : undefined}
                className={twMerge("relative", containerClassName)}
                onClick={allowProgramaticallyPopup ? handleClick : undefined}
                aria-haspopup
                onContextMenu={e => { e.preventDefault() }}>
                <OptionalChildren condition={frame.thumb} fallback={(
                    <video
                        className={className}
                        preload="metadata"
                        onLoadedMetadata={handleDuration}
                        disablePictureInPicture
                        title={alt}
                    >
                        <source src={path} />
                    </video>
                )}>
                    <Image
                        fill
                        src={frame.thumb!}
                        className={className}
                        alt={alt}
                        unoptimized={isEmbeddingFrame(frame.extSource)}
                        blurDataURL={frame.hash ? decodeHash(frame.hash) : undefined}
                        placeholder={frame.hash ? "blur" : "empty"}
                    />
                </OptionalChildren>
                <div className="absolute bottom-4 right-4 flex gap-1 items-center text-zinc-200">
                    <OptionalChildren condition={duration && !hideDuraion}>
                        <span className="px-2 py-1 bg-black/50 text-sm rounded-md">{duration}</span>
                    </OptionalChildren>
                    <OptionalChildren condition={!skipSourceIcon}>
                        <SourceIconMap extSource={frame.extSource} />
                    </OptionalChildren>
                </div>
            </div>
            <OptionalChildren condition={allowProgramaticallyPopup}>
                <div
                    style={{ margin: 0, padding: 0, height: "100%", width: "100%" }}
                    className="hidden"
                    aria-hidden
                    id={`parloVideoPlayer-${Math.random().toString(32).slice(2)}`}
                    ref={videoContainer}
                >
                    <VideoPlayer poster={frame.thumb} playState={play} src={path} />
                </div>
            </OptionalChildren >
        </>
    )

}

export default ParloVideo;