import { oneKb, oneMb } from "@lib/shared/constants";

export type FileAcceptTypes = Blob | File | string;

export const scaleImage = async (file: File): Promise<Blob | null> => {
    if (!file) return null;
    const reader = new FileReader();
    reader.readAsDataURL(file);

    try {
        const blob = await new Promise<Blob | null>(
            (resolve, reject) =>
            (reader.onloadend = () => {
                const image = new Image();
                image.src = reader.result as string;
                image.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                    const context = canvas.getContext("2d");
                    if (!context) {
                        reject("no context");
                        return null;
                    }
                    context.drawImage(image, 0, 0);
                    canvas.toBlob((blob) => {
                        if (!blob) reject("No blob found");
                        else resolve(blob);
                    }, `image/webp`);
                };
            })
        );
        return blob;
    } catch (err: any) {
        console.error("Failed scaling image" + err);
        return null;
    }
};

const getPath = (obj: FileAcceptTypes): string => {
    if (typeof obj === "string") return obj;

    else return URL.createObjectURL(obj);
}

export const convertByteIntoSize = (size: number | undefined): string => {
    if (!size) return '';
    let newSize = size;
    let unit = "B";

    if (size > oneMb) {
        newSize = size / oneMb;
        unit = "MB"
    } else if (size > oneKb) {
        newSize = size / oneKb;
        unit = "KB"
    }

    const [int, frac] = newSize.toString().split(".");
    return [int].concat([frac?.slice(0, 2)]).join('.').concat(` ${unit}`)
}

const twoDigit = (num: number) => num.toString().padStart(2, "0");

export const formatTimeAsDuration = (seconds: number): string => {
    if (seconds < 0 || !Number.isFinite(seconds)) {
        return `00:00`;
    }

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);


    if (hrs > 0) {
        // Format as HH:MM:SS if there is at least one hour
        return `${twoDigit(hrs)}:${twoDigit(mins)}:${twoDigit(secs)}`;
    } else {
        // Otherwise, format as MM:SS
        return `${twoDigit(mins)}:${twoDigit(secs)}`;
    }
}

/**
 * Generates thumbnail or snapshot of a provided video in the browser at the given time.
 * 
 * @param file Video File - Blob or File or video path as string
 * @param timeInSeconds duration at which the snapshot should be taken
 * @returns thumbnail or shapshot URL of the provided video at the given time
 */

type VideoDurationAndThumbResponse = { thumb: Blob, duration: number };

export const getVideoDurationAndThumbnail = async (file: FileAcceptTypes, timeInSeconds = 0.01, width?: number, height?: number) => {
    const path = getPath(file);

    return new Promise<VideoDurationAndThumbResponse>((res, rej) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;

        if (!context) rej("Context not found");

        video.setAttribute("crossorigin", "anonymous");
        video.preload = "metadata";

        video.addEventListener("loadeddata", () => {
            video.currentTime = timeInSeconds;
        });

        video.addEventListener("seeked", () => {

            canvas.width = width ? Math.min(width, video.videoWidth) : video.videoWidth;
            canvas.height = height ? Math.min(height, video.videoHeight) : video.videoHeight;

            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob === null) rej("Blob not found while generating thumbnail");
                res({
                    thumb: blob as Blob,
                    duration: video.duration,
                })
            })
        });

        video.addEventListener("error", () => {
            console.error("Error generating thumbnail");
            rej("Unable to load this video!")
        });

        video.src = path;
        video.load();
    });
}

/**
* A function that converts blob | file to image element.
*
* @param blob Blob | File to load image
* @returns HTMLImageElement
*/

const loadImage = (file: FileAcceptTypes): Promise<HTMLImageElement> => {
    const path = getPath(file);
    return new Promise((resolve, reject) => {

        const img = new Image();
        // img.crossOrigin = "anonymous";

        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };

        img.onerror = (err) => {
            console.error("image failed to load", err);
            reject(err);
        };

        img.src = path;
    });
}

export const imagePathToBlob = async (
    imagePath: string,
    type: string = "image/webp",
    quality?: number
): Promise<Blob> => {
    const img = new Image();

    // Required to avoid tainted canvas
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    img.src = imagePath;

    // Wait for image to load
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
            reject(new Error(`Failed to load image: ${imagePath}`));
    });

    // Decode into ImageBitmap (faster draw path)
    const bitmap = await createImageBitmap(img);

    // Create OffscreenCanvas
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        bitmap.close();
        throw new Error("Failed to get 2D context from OffscreenCanvas");
    }

    ctx.drawImage(bitmap, 0, 0);

    // Free bitmap memory early
    bitmap.close();

    // Convert to Blob
    return canvas.convertToBlob({ type, quality });
}

export const getImageData = async (img: FileAcceptTypes) => {
    const image = await loadImage(img);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext('2d');

    if (!context) throw new Error("No context is created");

    const scale = 100 / Math.max(image.width, image.height);
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    return { data, width, height }
}
