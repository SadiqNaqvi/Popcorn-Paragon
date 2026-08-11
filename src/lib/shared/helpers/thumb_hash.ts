
import { FileAcceptTypes, getImageData } from "@lib/frontend/helpers/media";
import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";

const isServer = () => typeof window === "undefined"

export const binaryToBase64 = (binary: Uint8Array) => {
    if (isServer()) return Buffer.from(binary).toString('base64')
    return btoa(String.fromCharCode(...binary))
}

export const base64ToBinary = (base64: string) => {
    if (isServer())
        return new Uint8Array(Buffer.from(base64, 'base64'))

    return new Uint8Array(atob(base64).split('').map(x => x.charCodeAt(0)))
}

/**
* A function to create thumbnail hash.
* A thumbnail hash is a 20-30 character long string which represents the image in a low-res blurry way.
* Thumbnail has can be used as a placeholder while the image is loading.
* 
* @param file: Blob | File to create image hash
* @returns string
*/

export const createThumbHash = async (file: FileAcceptTypes) => {
    const { data, height, width } = await getImageData(file);
    const binary = rgbaToThumbHash(width, height, data);
    return binaryToBase64(binary);
}

/**
* A function that converts the thumb hash into temporary image url
* 
* @param hash Base64 string
* @returns string
*/

export const decodeHash = (base64: string) => thumbHashToDataURL(base64ToBinary(base64));
