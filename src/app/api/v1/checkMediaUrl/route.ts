import { oneDayInSeconds } from "@lib/shared/constants";
import { binaryToBase64 } from "@lib/shared/helpers/thumb_hash";
import { Frame } from "@type/internal";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";

const createThumbHash = async (file: ArrayBuffer | string) => {

    const buffer = typeof file === "string" ? await (await fetch(file)).arrayBuffer() : file;
    const { data, info } = await sharp(buffer)
        .resize(100, 100, { fit: "inside" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    // 3️⃣ Generate thumbhash
    return binaryToBase64(rgbaToThumbHash(info.width, info.height, data));

}

const workOnWebMedia = async (resp: Response) => {

    let size = 0;

    if (resp.status === 206) {
        const contentRange = resp.headers.get("content-range");
        // Example: "bytes 0-100/123456789"

        if (contentRange) {
            const totalSize = contentRange.split("/")[1];
            size = Number(totalSize);
        }
    } else {
        const contentLength = resp.headers.get("content-length");
        if (!contentLength) return null;

        size = Number(contentLength);
    }

    // Fallback

    const body = await resp.blob()
    const { type } = body;

    const [mime, ext] = type.split('/');

    if (mime !== "image" && mime !== "video")
        return null;

    const hash = mime === "image" ? await createThumbHash(await body.arrayBuffer()) : undefined;

    return { size, mime, ext, hash }
}

type VimeoResult = {
    id: string | number,
    // Example: 357274789
    title: string,
    description: string,
    url: string,
    // Example: 'https://vimeo.com/357274789',
    thumbnail_large: string,
    duration: number,
    width: number,
    height: number,
}

type YoutubeResult = {
    title: string,
    type: 'video',
    thumbnail_height: number,
    thumbnail_width: number,
    thumbnail_url: 'https://i.ytimg.com/vi/NGbiNYUrFqA/hqdefault.jpg',
}

const validateMediaUrls = async (source: string, path: string, searchParams: URLSearchParams): Promise<{
    success: boolean,
    error?: string,
    result?: Omit<Frame, "blob" | "isExternal" | "shouldUpload" | "extSource">
}> => {

    if (source === "mega") {
        const key = searchParams.get("key");

        if (!key) return {
            success: false,
            error: "Key is required for mega."
        };

        const url = `${process.env.QCORE_CLOUD_URI}/media/v1/mega/${path}?key=${key}`;

        const resp = await fetch(url, {
            headers: { range: "bytes=0-100" }
        });

        if (resp.ok) {

            const headers = new Headers(resp.headers);

            const size = Number(headers.get("Content-Size")) || 0;

            const type = headers.get("Content-type")

            // the header would be like this: "{mime}/{ext}";
            const [mime] = type?.split('/') || [];

            const hash = mime === "image" ? await createThumbHash(await resp.arrayBuffer()) : undefined;

            if (mime === "image" || mime === "video") return {
                success: true,
                result: {
                    size,
                    type: mime,
                    hash,
                    path: url,
                    thumb: undefined
                }
            };

            console.warn("Response while checking mega file:", resp.status, resp.statusText, resp);

            return {
                success: false,
                error: "Invalid Media Type. Only Image and Video is allowed."
            }

        } else {
            const response = await resp.text();
        }
    } else if (source === "youtube") {
        const resp = await fetch(`https://youtube.com/oembed?url=${encodeURIComponent(path)}&format=json`)

        if (resp.ok) {
            const result: YoutubeResult = await resp.json();

            const match = path.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);

            const video_id = match && match[7];

            if (!video_id || video_id.length !== 11) return {
                success: false,
                error: "Invalid URL. Please enter a valid Youtube URL."
            }

            return {
                success: true,
                result: {
                    path: `https://youtube.com/watch?v=${video_id}`,
                    type: "video",
                    hash: await createThumbHash(result.thumbnail_url),
                    thumb: result.thumbnail_url,
                }
            }
        }

    } else if (source === "vimeo") {

        const resp = await fetch(`https://vimeo.com/api/v2/video/${path}.json`);

        if (resp.ok) {
            const [result]: [VimeoResult] = await resp.json();

            return {
                success: true,
                result: {
                    path: result.url,
                    type: "video",
                    duration: result.duration,
                    thumb: result.thumbnail_large,
                    hash: await createThumbHash(result.thumbnail_large)
                }
            }
        }
    } else {
        const url = new URL(path);

        const sp = url.searchParams;
        const doesSearchHaveSizeParams = sp.size > 0 && (sp.has("w") || sp.has("h") || sp.has("q") || sp.has("width") || sp.has("width") || sp.has("quality"));

        if (!doesSearchHaveSizeParams) {
            const response = await fetch(path, { headers: { range: "bytes=0-100" } });
            if (response.ok) {
                const result = await workOnWebMedia(response);
                if (result) return {
                    success: true,
                    result: {
                        path,
                        hash: result.hash,
                        size: result.size,
                        type: result.mime as Frame["type"],
                    }
                };
            }
        } else {
            const pathWithoutSParams = url.origin + url.pathname;

            const [respWithSp, respWithoutSp] = await Promise.all([
                fetch(path, { headers: { range: "bytes=0-100" } }),
                fetch(pathWithoutSParams, { headers: { range: "bytes=0-100" } }),
            ]);

            const result = respWithoutSp.ok ? await workOnWebMedia(respWithoutSp) : await workOnWebMedia(respWithSp);
            if (result) return {
                success: true,
                result: {
                    path: respWithoutSp.ok ? pathWithoutSParams : path,
                    hash: result.hash,
                    size: result.size,
                    type: result.mime as Frame["type"],
                }
            };
        }
    }

    return {
        success: false,
        error: "Nothing could be found with the provided URL."
    }
}

export const GET = async (req: NextRequest) => {

    const { searchParams } = req.nextUrl;

    const source = searchParams.get("source");

    if (!source) return NextResponse.json({
        success: false,
        error: "Source is required",
    }, { status: 400 });

    const path = searchParams.get("path");

    if (!path) return NextResponse.json({
        success: false,
        error: "Path is required"
    }, { status: 400 });

    const headers = new Headers();

    headers.set("Cache-Control", `public, max-age=${oneDayInSeconds}`);

    try {
        const response = await validateMediaUrls(source, path, searchParams);

        return NextResponse.json(
            response,
            response.success
                ? { status: 200, headers }
                : { status: 404 }
        );

    } catch (err: any) {
        console.warn("Error occured while checking media url", err.message);
        return NextResponse.json({ success: false, error: "Uncaught error" }, { status: 500 })
    }
}