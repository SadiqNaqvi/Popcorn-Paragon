"use client";

import { AddIcon, GlobeIcon, LeftChevron, MegaIcon, VimeoIcon, XmarkIcon, YoutubeIcon } from "@assets/Icons";
import BottomSheet, { BottomSheetRef, NestedSheet } from "@components/BottomSheet";
import { Button, OptionalChildren } from "@components/ui";
import { mediaInputConfig, mediaUrlPattern, numberOfFrames, vimeoLinkPattern, youtubeLinkPattern } from "@lib/shared/constants";
import { convertByteIntoSize, getVideoDurationAndThumbnail, scaleImage } from "@lib/frontend/helpers/media";
import { createThumbHash } from "@lib/shared/helpers/thumb_hash";
import appToast from "@lib/frontend/providers/appToast";
import { fileSchema, megaFileSchema, urlSchema } from "@lib/shared/validation/schemas";
import { Frame } from "@type/internal";
import { InputManagerType, TypedFunction } from "@type/other";
import { ExtMediaSource, InputFrame } from "@type/schemas";
import Image from "next/image";
import { ChangeEvent, PropsWithChildren, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { Form, Input } from ".";

type Sections = "all" | ExtMediaSource;

const showError = (err: string) => {
    appToast.error(err)
}

const FrameWrapper = ({ children, className }: PropsWithChildren<{ className: string | undefined }>) => (
    <div className={twMerge("min-w-60 size-60 border rounded-md overflow-hidden border-gray40 relative", className)}>
        {children}
    </div>
);

const FrameContainer = ({ path, type, size, thumb, remove, className }: InputFrame & { remove?: TypedFunction<string>, className?: string }) => {

    const ExtraComponents = () => (
        <>
            <OptionalChildren condition={remove}>
                <Button
                    id="frame-remove"
                    title="Remove Frame"
                    onClick={() => remove?.(path)}
                    className="absolute smallBtn p-1 right-0 top-0 mt-1 mr-1 bg-black/50 text-white border border-gray40 rounded-md">
                    <XmarkIcon className="h-4" />
                </Button>
            </OptionalChildren>
            <OptionalChildren condition={size}>
                <span className="absolute bottom-0 right-0 mr-2 mb-2 bg-black/50 text-sm text-white rounded-md p-1">
                    {convertByteIntoSize(size || 0)}
                </span>
            </OptionalChildren>
        </>
    );

    if (type === "image" || thumb) return (
        <FrameWrapper className={className}>
            <Image
                className="aspect-square h-full object-contain"
                src={thumb || path}
                alt="Chosen Frame"
                width={240} height={240}
            />
            <ExtraComponents />
        </FrameWrapper>
    )

    else return (
        <FrameWrapper className={className}>
            <video
                height={240}
                width={240}
                poster={thumb}
                preload={thumb ? "none" : "metadata"}
                className="size-full h-full object-contain"
            >
                <source src={path} />
            </video>
            <ExtraComponents />
        </FrameWrapper>
    )

}

const UploadFromRest = ({ setUrl, goBack, section }: { setUrl: TypedFunction<string>, section: Sections, goBack: TypedFunction }) => {

    const handleSubmit = async ({ url }: { url: string }) => {
        if (section === "web") {
            if (mediaUrlPattern.test(url))
                setUrl(url);
            else return "Invalid URL! Make sure it contains https and ends with an extension like .jpg, .png, .mp4, etc."
        }
        else {
            const { success, error } = urlSchema.safeParse(url);
            if (!success) return error.issues[0]?.message;
            else if ((section === "youtube" && !youtubeLinkPattern.test(url)) || (section === "vimeo" && !vimeoLinkPattern.test(url)))
                return `Invalid Url! Please provide a valid ${section} shareable url.`
        }

        setUrl(url);
    }

    return (
        <div className="px-2">
            <header>
                <div className="mx-auto flex gap-2 items-center">
                    <Button
                        id="back-button"
                        title="Go Back"
                        onClick={goBack}
                    >
                        <LeftChevron />
                    </Button>
                    <h4 className="text-lg capitalize">Upload from {section}</h4>
                </div>
                <p className="text-sm text-center">Just copy the link of the content and past it here. Simple</p>
            </header>

            <Form className="mt-4" submit={handleSubmit}>
                <Input
                    name="url"
                    placeholder="Paste the link here..."
                    description={section === "web" ? "Make sure it is the link of the content, not the page" : undefined}
                />

                <Button
                    id="submit"
                    title="Upload"
                    type="submit"
                    className="primary mt-3 w-full"
                >
                    Upload
                </Button>
            </Form>

        </div>
    )

}

const UploadFromMega = ({ setUrl, goBack }: { setUrl: TypedFunction<string>, goBack: TypedFunction }) => {

    const handleSubmit = async ({ url }: { url: string }) => {
        const { success, data, error } = megaFileSchema.safeParse(url);

        if (success) setUrl(data);
        else return error.issues[0].message;
    }

    return (
        <section className="px-2">
            <div>
                <div className="mx-auto flex gap-2 items-center">
                    <Button
                        id="back"
                        title="Go Back"
                        onClick={goBack}
                    >
                        <LeftChevron />
                    </Button>
                    <h4 className="text-lg">Upload from Mega</h4>
                </div>
                <p className="text-sm text-center">This is the best way to upload large videos and images here. Just upload your file on Mega and drop the link here.</p>
            </div>

            <Form className="mt-4" submit={handleSubmit}>
                <Input
                    name="url"
                    placeholder="https://mega.nz/file/{id}#{key}"
                    description="Make sure key is attached with the url"
                />

                <Button
                    id="submit"
                    title="Upload"
                    type="submit"
                    className="primary mt-3 w-full"
                >
                    Upload
                </Button>
            </Form>

        </section>
    )

}

type URLUploadOption = { icon: React.ReactNode, label: string, id: Sections };

const videoUrlUploadOptions: URLUploadOption[] = [
    { icon: <YoutubeIcon className="size-6" />, label: "Youtube", id: "youtube" },
    { icon: <VimeoIcon className="size-6" />, label: "Vimeo", id: "vimeo" },
];

const imageUrlUploadOptions: URLUploadOption[] = [
    { icon: <MegaIcon className="size-6" />, label: "Mega", id: "mega" },
    { icon: <GlobeIcon className="size-6" />, label: "Other", id: "web" }
];

const combineUploadOptions = videoUrlUploadOptions.concat(imageUrlUploadOptions);

type ValidatedMediaResponse = {
    success: boolean,
    error?: string,
    result?: Omit<Frame, "blob" | "isExternal" | "shouldUpload" | "extSource">
};

const checkMediaLink = async (url: string): Promise<ValidatedMediaResponse["result"]> => {

    const resp = await fetch(url);

    const { error, result, success } = await resp.json() as ValidatedMediaResponse;

    if (resp.ok && success) return result;

    else if (error) {
        showError(error);
        return;
    }

    showError("Nothing could be found! Please check the link and try again.");
}

const validateLinkAndReadyFrame = async (url: string, section: Sections): Promise<InputFrame | undefined> => {

    let apiPath = `/api/v1/checkMediaUrl?source=${section}`;

    if (section === "mega") {
        const idWithKey = url.split('/').at(-1);
        const [id, key] = idWithKey?.split('#') || [];

        if (!id || !key) {
            showError("Invalid URL! Please provide a valid mega url with key attached");
            return;
        }
        apiPath += `&path=${id}&key=${key}`;
    } else if (section === "web" || section === "youtube") {
        apiPath += `&path=${url}`;
    } else if (section === "vimeo") {
        const segments = url.split('/');
        const id = segments[segments.length - 1];
        if (!id) {
            showError("Invalid url! Please choose a valid vimeo url");
            return;
        }
        apiPath += `&path=${id}`;
    } else {
        showError("Something went wrong. Please go back and try again.");
        return;
    }

    const result = await checkMediaLink(apiPath);

    if (!result) {
        showError("Something went wrong. Please go back and try again.");
        return;
    }

    else if (result?.type !== "video" && result?.type !== "image") {
        showError("Invalid Media Type! Only Images and Videos are allowed.");
        return;
    }

    const imageResult: InputFrame = {
        blob: null,
        isExternal: true,
        path: result.path,
        shouldUpload: false,
        duration: result.duration,
        thumb: result.thumb,
        type: result.type,
        extSource: section,
        hash: result.hash,
        size: result.size
    }

    if (result.type === "image" || section === "vimeo" || section === "youtube")
        return imageResult;

    const { duration, thumb } = await getVideoDurationAndThumbnail(result.path);
    const hash = await createThumbHash(thumb);

    return {
        ...imageResult,
        duration,
        hash,
        thumb: URL.createObjectURL(thumb),
    }

}

export const MediaInputPrompt = ({ type, callback }: { type: "image" | "both", callback: TypedFunction<[InputFrame]> }) => {

    const [frame, setFrame] = useState<InputFrame | null>(null);
    const [section, setSection] = useState<Sections>("all");
    const [loading, setLoading] = useState(false);

    const handleUploadFromUrl = async (url: string) => {
        setLoading(true);

        try {
            const frame = await validateLinkAndReadyFrame(url, section);

            if (!frame) return;

            else if (type === "image" && frame.type === "video") {
                return showError("Invalid Media Type! Only Images are allowed.");
            }

            setFrame(frame);
        } catch (e: any) {
            console.warn("Error handling upload from url", e);
            showError("Unstable Internet Connection!");
        } finally {
            setLoading(false);
        }
    }

    const handleDeviceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;

        setLoading(true);

        const file: File = event.target.files[0];

        const { success, error } = fileSchema.safeParse(file);

        if (!success) {
            setLoading(false);
            return error.issues.map(err => showError(err.message));
        }

        try {

            let blob: Blob | null = null,
                hash: string | undefined = undefined,
                thumb: string | undefined,
                duration: number | undefined;

            const fileMime = file.type.split('/')[0]

            if (fileMime === "image") {
                const [scaledImageBlob, imageHash] = await Promise.all([
                    scaleImage(file),
                    createThumbHash(file),
                ]);

                if (!scaledImageBlob) return showError("Failed to upload image! Please try again.");

                blob = scaledImageBlob;
                hash = imageHash;
            } else if (fileMime === "video") {
                if (type === "image") return showError("Upload an image please!")

                const videoData = await getVideoDurationAndThumbnail(file, 0.01, 640);
                thumb = URL.createObjectURL(videoData.thumb);
                duration = videoData.duration;
                blob = new Blob([file], { type: file.type });
                if (!blob) return showError("Failed to upload! Please try again.")
            } else return showError("Invalid file type! Only images and videos are allowed to upload.")

            const path = URL.createObjectURL(blob);

            setFrame({
                type: fileMime,
                size: blob.size,
                path,
                blob,
                isExternal: false,
                shouldUpload: true,
                hash,
                duration,
                thumb,
            });

        } catch (err: any) {
            console.warn("Error occured while handling media upload:", err.message)
            showError("Something went wrong! Please try again.")
        } finally {
            setLoading(false);
        }
    }

    const changeSectionToAll = () => setSection("all");

    const returnMedia = () => {
        if (!frame) return;
        callback(frame);
        setFrame(null);
    }

    const removeFrame = (error?: boolean) => {
        setFrame(null);
        if (error) showError("Unsupported Media or Internet Connection Problem! Please try again");
    }

    if (frame) return (
        <section className="space-y-4 p-4 overflow-auto">

            <FrameContainer className="mx-auto" {...frame} />

            <div className="flex gap-2 flex-cntr-all">
                <Button
                    id="upload-options-cancel"
                    title="Cancel"
                    className="flex-1 sm:flex-0 secondary"
                    onClick={() => removeFrame()}
                >
                    Cancel
                </Button>
                <Button
                    id="upload-options-add"
                    title="Add"
                    className="flex-1 sm:flex-0 secondary"
                    onClick={returnMedia}
                >
                    Add
                </Button>
            </div>
        </section>
    )

    else if (loading) return (
        <section>
            <div className="min-w-60 mx-auto size-60 flex flex-cntr-all border rounded-md border-gray40 relative">
                <span className="size-6 animate-spin border-2 border-gray-500/30 border-l-(--secondary) rounded-full"></span>
                <span className="px-8 py-4 rounded-md absolute bottom-2 right-2 skeletonPulse"></span>
            </div>
        </section>
    )

    else if (section === "mega") return (
        <UploadFromMega goBack={changeSectionToAll} setUrl={handleUploadFromUrl} />
    )

    else if (section === "web" || (type === "both" && (section === "vimeo" || section === "youtube"))) return (
        <UploadFromRest goBack={changeSectionToAll} section={section} setUrl={handleUploadFromUrl} />
    )

    return (
        <section className="px-2">
            <div className="space-y-2">
                <h4 className="parloHeading">Upload from URL</h4>
                <ul className="flex gap-2 overflow-x-auto noScroll">
                    {(type === "image" ? imageUrlUploadOptions : combineUploadOptions).map(({ icon, id, label }) => (
                        <li key={id}>
                            <Button
                                id={`url-upload-options-${id}`}
                                title={label}
                                onClick={() => setSection(id)}
                                className="flex gap-1 items-center p-2 border border-gray40 rounded-md">
                                {icon}
                                <span className="text-sm">{label}</span>
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-8 space-y-2">
                <h4 className="parloHeading">Device Upload</h4>
                <div className="relative cursor-pointer">

                    <Button
                        id="device-frame-upload"
                        title="Upload from device"
                        className="primary w-full"
                    >
                        Upload
                    </Button>

                    <input
                        onChange={handleDeviceUpload}
                        className="absolute inset-0 opacity-0"
                        title="" type="file"
                        // accept={type === "image" ? mediaInputConfig.image.accept : `${mediaInputConfig.image.accept}, ${mediaInputConfig.video.accept}`}
                        accept={mediaInputConfig.image.accept}
                    />
                </div>
            </div>
        </section>
    )
}

type ManagerProps = {
    title?: string,
    limit?: number,
    allowBoth?: true,
    defaultFrames?: Frame[];
    className?: string;
    getterRef: React.RefObject<InputManagerType<InputFrame[]> | null>;
    promptRef?: React.RefObject<BottomSheetRef | null>;
};

const convertFrameToInputFrame = (frame: Frame[] | undefined): InputFrame[] => {

    if (!frame) return [];
    return frame?.map(({ hash, path, size, type, duration, thumb }) => ({
        blob: null,
        hash,
        isExternal: true,
        path,
        shouldUpload: false,
        size,
        type,
        duration,
        thumb,
    }))
}

const MediaInputManager = ({ title, limit = 5, allowBoth, defaultFrames, getterRef, promptRef, className }: ManagerProps) => {

    const [frames, setFrames] = useState<InputFrame[]>(convertFrameToInputFrame(defaultFrames));
    const [frameType, setFrameType] = useState<"image" | "both">(allowBoth ? "both" : "image");

    useImperativeHandle(getterRef, () => ({
        getData: () => frames,
        length: frames.length,
    }));

    const getframe = (frame: InputFrame) => {

        if (frames.length >= (limit ?? 1)) return;

        else if (frames.findIndex(f => f.path === frame.path) > -1) {
            toast.error("Duplicate Frame removed!");
            return;
        }

        else if (frame.type === "video") {
            const mediaUploadedVideoFramesCount = frames.filter(el => el.type === "video" && !el.isExternal).length;
            if (mediaUploadedVideoFramesCount + 1 === numberOfFrames.videos)
                setFrameType("image");
            else if (mediaUploadedVideoFramesCount + 1 > numberOfFrames.videos) {
                toast.error("No more media uploaded videos allowed!");
                return;
            }
        }

        setFrames([...frames, frame]);
    }

    const removeframe = (path: string) => {
        setFrames(frames.filter(el => el.path !== path));
    }

    if (!frames.length) return (
        <NestedSheet ref={promptRef}>
            <MediaInputPrompt callback={getframe} type={frameType} />
        </NestedSheet>
    );

    return (
        <section className={twMerge("space-y-4", className)}>

            <OptionalChildren condition={title}>
                <h4 className="capitalize">{title}</h4>
            </OptionalChildren>


            <div className="flex gap-2 overflow-x-auto noScroll">

                {frames.map(frame => (
                    <FrameContainer {...frame} remove={removeframe} key={frame.path} />
                ))}

                <OptionalChildren condition={frames.length < (limit || 1)}>
                    <BottomSheet
                        ref={promptRef}
                        className="size-60 rounded-md border-dashed border border-gray40 aspect-square backdrop:brightness-50 flex flex-cntr-all"
                        button={<AddIcon />}
                        buttonTitle="Add Frame"
                        containerClassName="min-h-fit"
                    >
                        <MediaInputPrompt callback={getframe} type={frameType} />
                    </BottomSheet>
                </OptionalChildren>
            </div>
        </section>
    )
}

export default MediaInputManager;