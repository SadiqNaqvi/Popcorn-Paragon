"use server";

import { handleArrayForArrayResponse, parseResponse, ParseResponseType } from "@lib/shared/utils";
import { File as FormidableFile } from "formidable";
import { promises } from "fs";
import 'server-only';

type NsfwEnum = "Yes" | "No" | "Possible";
type MediaType = "image" | "video";

type QCoreCloudResponse<T> = {
    success: false,
    error: string
} | {
    success: true,
    result: T
}

type UploadResponse = {
    nsfw: NsfwEnum;
    resource_type: MediaType;
    size: number;
    path: string;
    thumbnail: string | undefined;
}

export const uploadThumbnailFromUrl = async (path: string) => {

    const uri = process.env.QCORE_CLOUD_UPLOAD_URI;
    const apiKey = process.env.QCORE_CLOUD_AUTH_KEY;
    if (!uri) throw new Error("QCORE_CLOUD_UPLOAD_URI env variable is undefined!");
    else if (!apiKey) throw new Error("QCORE_CLOUD_AUTH_KEY env variable is undefined!");

    const response = await fetch(`${uri}/thumb?url=${path}`, {
        method: "POST",
        headers: {
            authorization: `Bearer ${apiKey}`,
        },
    });
    const result: QCoreCloudResponse<string> = await response.json();
    if (!result.success) throw new Error(result.error);

    return result.result;
}

const getFromDiskAndUpload = async (file: FormidableFile, uri: string, apiKey: string) => {

    const fileBuff = (await promises.readFile(file.filepath));

    if(!file.mimetype)
        throw new Error("File type is not defined.");
    else if(!(file.mimetype.includes("image") || file.mimetype.includes("video")))
        throw new Error("File is neither Image nor Video.");


    const formdata = new FormData();
    formdata.append(
        "files",
        new Blob([fileBuff], { type: file.mimetype }),
        file.originalFilename || file.newFilename,
    );

    return await fetch(uri, {
        method: "POST",
        headers: {
            authorization: `Bearer ${apiKey}`,
        },
        body: formdata
    }).then(r => parseResponse<QCoreCloudResponse<UploadResponse[]>>(r));

}

export const uploadMediaFiles = async <T extends FormidableFile | FormidableFile[]>(file: T) => {
    const files = (!file ? [] : Array.isArray(file) ? file : [file]) as FormidableFile[];

    if (!files || !files.length)
        throw new Error("Files are requred to upload");

    const uri = process.env.QCORE_CLOUD_UPLOAD_URI;
    const apiKey = process.env.QCORE_CLOUD_AUTH_KEY;
    if (!uri) throw new Error("QCORE_CLOUD_UPLOAD_URI env variable is undefined!");
    else if (!apiKey) throw new Error("QCORE_CLOUD_AUTH_KEY env variable is undefined!");

    let results: UploadResponse[] = [];

    try {
        await Promise.all(files.map(file => getFromDiskAndUpload(file, uri, apiKey)
            .then(({ json, ok, text }) => {

                if (!ok || !json) {
                    throw new Error(`Media Upload Failed, Response = ${text}`);
                }
                
                else if (!json.success) {
                    throw new Error(`Media Upload Failed, ${json.error}`);
                }

                results = [...results, ...json.result];
            })
        ));

        return handleArrayForArrayResponse(file, results);
    } catch (err) {
        console.warn("Error in files upload", err);
        deleteMediaFiles(results.map(r => r.path));
        return [];
    }
}

export const deleteMediaFiles = async (path: string | string[]) => {
    const paths: string[] = !path ? [] : Array.isArray(path) ? path : [path];
    if (!paths || !paths.length) return [];

    const uri = process.env.QCORE_CLOUD_URI;
    const apiKey = process.env.QCORE_CLOUD_AUTH_KEY;
    if (!uri) throw new Error("QCORE_CLOUD_URI env variable is undefined!");
    else if (!apiKey) throw new Error("QCORE_CLOUD_AUTH_KEY env variable is undefined!");

    const { json, ok, status, text } = await fetch(`${uri}/delete`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({ paths })
    }).then(parseResponse) as ParseResponseType<QCoreCloudResponse<any>>;

}