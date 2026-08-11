import WarnTeamParlocula from "@components/EmailTemplates/warnParlocula";
import { getUserFromToken } from "@lib/backend/utils";
import { attachedFramesLimit, oneMb } from "@lib/shared/constants";
import { connectDatabase } from "@lib/backend/providers/database";
import { deleteMediaFiles, uploadMediaFiles, uploadThumbnailFromUrl } from "@lib/backend/providers/media";
import { parseObject } from "@lib/shared/utils";
import { getRevalidateTags } from "@lib/backend/utils";
import { render } from "@react-email/components";
import { Frame, GeneralGetReturn, GeneralPostReturn } from "@type/internal";
import type { ClientSession } from "@type/mongoose";
import { AvailableRevalidateTags, ErrorCodes, RevalidateTagsArgs } from "@type/other";
import { FrameDataSchemaType } from "@type/schemas";
import formidable, { File as FormidableFile } from "formidable";
import { updateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { Readable } from "stream";
import type { ZodObject } from "zod";
import { updateQuotaLimit } from "../redis/rate_limiting";
import { sendEmail } from "@lib/backend/actions/email";

type RT = AvailableRevalidateTags;

export type HandlerParamVariable = { id: string; cuid: string;[key: string]: string }

type NotArray<T> = T extends any[] ? never : T;

export type GetHandlerFunction<T> = (r: NextRequest, params: HandlerParamVariable) =>
    Promise<GeneralGetReturn<NotArray<T>> & { custom_error?: string }>

export type MutationHandlerFunctionParams<T = unknown> = {
    data: Omit<T, "files" | "filesData" | "filesToRemove">;
    frames: Frame[];
    user_id: string;
    isNsfw: boolean;
    username: string;
    profile: string | undefined;
    session: ClientSession;
    req: NextRequest;
    params: HandlerParamVariable;
};

export type PrecheckParams<T = unknown> = Omit<
    MutationHandlerFunctionParams<T>,
    "frames" | "session" | "profile" | "isNsfw"
>;

export type PrecheckResponse = Omit<GeneralPostReturn, "result">;

export type PrecheckFunction<T = unknown> = (p: PrecheckParams<T>) => PrecheckResponse | Promise<PrecheckResponse>;

export type WarningPayload = {
    title: string,
    desc: string,
    path: string,
}

export type HandlerResponse = {
    result: any;
    success: true;
    warnTeamParlocula?: WarningPayload,
    errCode?: null;
    options: Partial<RevalidateTagsArgs<RT>>;
    available: RT;
    revalidateQueue?: string[];
} | {
    result: any;
    success: true;
    warnTeamParlocula?: WarningPayload,
    errCode?: null;
    options?: undefined;
    available?: undefined;
    revalidateQueue: string[];
} | {
    result?: null;
    success: false;
    errCode: ErrorCodes;
    options?: undefined;
    warnTeamParlocula?: undefined,
    available?: undefined;
    revalidateQueue?: undefined;
};

type DeleteHandlerResponse = Promise<Omit<HandlerResponse & { files?: Frame[] }, "result">>

export const getHandler = <T extends any>(handler: GetHandlerFunction<T>) => {
    return async function (req: NextRequest, { params }: { params: Promise<HandlerParamVariable> }) {
        try {
            const isDbConnected = await connectDatabase();
            if (!isDbConnected) return NextResponse.json(
                {
                    success: false,
                    errCode: "database_connection_fail",
                },
                { status: 500 }
            );

            const data = await handler(req, await params);

            return NextResponse.json(data, { status: data.success ? 200 : 500 });
        } catch (err: any) {
            console.error(`Error occurred at path ${req.nextUrl.pathname}:`, err.message);
            return NextResponse.json(
                {
                    errCode: "uncaught_error",
                    success: false,
                },
                { status: 500 }
            );
        }
    };
};

const uploadFiles = async (files: FormidableFile[], filesData: FrameDataSchemaType[], checkNsfw: boolean): Promise<{ frames: Frame[], isNsfw: boolean }> => {

    const results = files && files.length ? await uploadMediaFiles(files) : [];

    const thumbnails: (string | undefined)[] = await Promise.all(
        filesData.map(fileData => {
            if (fileData.type === "image") return;
            else if (fileData.extSource === "mega" || fileData.extSource === "web")
                return uploadThumbnailFromUrl(fileData.path)
            else return fileData.thumb;
        })
    );

    console.log(thumbnails);

    let isNsfw = false;

    const frames: Frame[] = filesData
        .map(({ isExternal, path, type, shouldUpload, hash, size, extSource, duration }, ind) => {

            if (!shouldUpload || isExternal) {
                if (type === "image" || !thumbnails[ind]) return {
                    path,
                    type,
                    isExternal,
                    size,
                    hash,
                    extSource,
                    duration,
                };

                return {
                    path, type, isExternal, size, hash, extSource, duration,
                    thumb: thumbnails[ind]
                };
            }

            const result = results.shift();

            if (!result)
                throw new Error("Media result could not be found");

            else if (checkNsfw && result.nsfw !== "No") {
                isNsfw = true;
            }

            return {
                path: result.path,
                type,
                isExternal,
                size,
                hash,
                extSource,
                duration,
                thumb: result.thumbnail,
            };

        });

    console.log(frames);

    return { frames, isNsfw };

};

const deleteFiles = async (files: Frame[]) => {
    if (!files || !files.length) return;
    const ids = files?.filter((file) => !file.isExternal).map(({ path }) => path) || [];
    await deleteMediaFiles(ids);
};

type HandlerData = { files?: FormidableFile[], filesData?: any[], [key: string]: any }

const getDataFromRequest = async <T>(req: NextRequest, schema: ZodObject | undefined): Promise<GeneralPostReturn<T>> => {

    if (!req.body) {
        if (schema) throw new Error("No body is attached in the request");
        else return { success: true, result: {} as T }
    }

    const body = Readable.from(req.body as any);
    Object.assign(body, {
        headers: Object.fromEntries(req.headers),
        method: req.method,
        url: req.url,
    });

    const fd = await formidable({
        multiples: true,
        maxFileSize: 100 * oneMb,
        maxFiles: attachedFramesLimit,
        keepExtensions: true,
    }).parse(body as any);

    const [fields, files] = fd;

    const uploadedFiles = Array.isArray(files.files) ? files.files : files.files ? [files.files] : [];

    const parsedFields = parseObject(fields);

    if (schema) {
        const { success, data, error } = schema.safeParse({ ...parsedFields, files: uploadedFiles });

        if (success) return { success, result: data as T }
        else return { success: false, errCode: "form_error", formError: error.issues }
    }

    return { success: true, result: { ...parsedFields, files: uploadedFiles } as T };
}

export const postHandler = <T extends HandlerData>({ handler, preCheck, schema, skipUserCheck }: {
    handler: (args: MutationHandlerFunctionParams<T>) => Promise<HandlerResponse>;
    preCheck?: PrecheckFunction<T>;
    schema?: ZodObject;
    skipUserCheck?: boolean,
}) => {
    return async function (req: NextRequest, { params }: { params: Promise<HandlerParamVariable> }) {

        console.log("Entered Post handler HOF", "skip user =", skipUserCheck);
        const payload = skipUserCheck ? null : await getUserFromToken(req.cookies);
        const awaitedParams = await params;

        if (!(skipUserCheck || payload)) return NextResponse.json(
            {
                success: false,
                errCode: "unauthenticated_access",
                result: null,
            },
            { status: 500 }
        );

        const user_id = payload?.user_id || "";
        const username = payload?.username || "";
        const profile = payload?.profile

        console.log("about to get data from formdata")
        const response = await getDataFromRequest<T>(req, schema);
        console.log("Successfully got data", response);

        if (!response.success) return NextResponse.json(response, { status: 400 });

        const data = response.result;

        let frames: Frame[] = [];
        let revalidateTags: string[] = [];
        let session: ClientSession | null = null;

        try {
            console.log("About to connect to database");
            const connection = await connectDatabase();
            if (!connection) return NextResponse.json(
                {
                    result: null,
                    success: false,
                    errCode: "database_connection_fail",
                },
                { status: 500 }
            );

            console.log("About to enter precheck");
            if (preCheck) {

                const { errCode, success } = await preCheck({
                    req,
                    params: awaitedParams,
                    user_id,
                    username,
                    data,
                });

                if (!success)
                    return NextResponse.json(
                        { result: null, success, errCode },
                        { status: 500 }
                    );
            }

            console.log("Starting session");
            session = await connection.startSession()
                .then((s) => {
                    console.log("Session successfully started");
                    return s
                })
                .catch((e) => {
                    console.log("Failed to start session", e)
                    return null;
                });

            if (!session)
                return NextResponse.json({ success: false, errCode: "uncaught_error" });

            let isNsfw = false;

            const { files, filesData, filesToRemove, ...rest } = data;

            if (filesData && filesData.length) {

                console.log("About to upload files");

                const res = await uploadFiles(files ?? [], filesData, !data.nsfw);

                console.log("Files uploaded", res);

                frames = res.frames;
                isNsfw = res.isNsfw;
            }

            console.log("Starting Transaction");
            session.startTransaction();

            console.log("Entering Handler");
            const { available, errCode, options, result, success, revalidateQueue, warnTeamParlocula } =
                await handler({
                    data: rest,
                    frames,
                    user_id: user_id as string,
                    username: username as string,
                    session,
                    req,
                    params: awaitedParams,
                    profile: profile?.path,
                    isNsfw,
                });

            console.log("Out of handler with success:", success);

            if (!success) {
                console.log("About to delete files");

                await deleteFiles(frames);
                console.log("About to abort transaction");

                await session.abortTransaction();
                console.log("transaction aborted");
            } else {
                if (warnTeamParlocula) {
                    console.log("About to warn creators");

                    await sendEmail({
                        email: process.env.CREATOR_EMAIL!,
                        subject: "Warning from Parlocula",
                        template: await render(WarnTeamParlocula(warnTeamParlocula))
                    });
                }

                if (revalidateQueue && revalidateQueue.length) {
                    revalidateTags.concat(revalidateQueue);
                } else if (available && options) {
                    revalidateTags.concat(getRevalidateTags(available, options));
                }

                console.log("commiting transaction");
                await session.commitTransaction();
                console.log("transaction commited");
            }

            return NextResponse.json(
                { result, success, errCode },
                { status: success ? 200 : 500 }
            );
        } catch (err: any) {
            console.log("In the catch block, deleting files.");

            await deleteFiles(frames);

            console.log("aborting transaction.");

            if (session?.inTransaction()) {
                await session.abortTransaction().catch(console.error);
                console.log("transaction aborted");

            }
            console.error(
                `Error occurred while POST at path ${req.nextUrl.pathname}:`,
                err.message
            );

            return NextResponse.json({
                result: null,
                success: false,
                errCode: "unknown_error",
            }, { status: 500 });
        } finally {
            if (session) {
                session.endSession();
                console.log("session ended");
            }
            console.log("revalidateTags", revalidateTags);
            revalidateTags.forEach((tag) => updateTag(tag));
        }
    };
};

export const deleteHandler = (
    handler: (args: Omit<MutationHandlerFunctionParams, "frames" | "data" | "isNsfw">) => DeleteHandlerResponse,
    precheck?: (req: NextRequest, params: any) => PrecheckResponse | Promise<PrecheckResponse>
) => {
    return async (req: NextRequest, { params }: { params: Promise<HandlerParamVariable> }) => {
        console.log("Entering Delete handler HOF");

        const payload = await getUserFromToken(req.cookies);

        if (!payload)
            return NextResponse.json({ success: false, errCode: "unauthenticated_access" });

        const user_id = payload.user_id;
        const username = payload.username;
        const profile = payload.profile;

        let revalidateTags: string[] = [];
        let session: ClientSession | null = null;

        try {
            console.log("Connecting Database");
            const connection = await connectDatabase();
            if (!connection)
                return NextResponse.json({ success: false, errCode: "database_connection_fail" });


            if (precheck) {
                console.log("Entering Precheck");
                const { success, errCode } = await precheck(req, params);
                console.log("Out of precheck with success:", success);

                if (!success) return NextResponse.json({ success, errCode });
            }

            console.log("Starting session");

            session = await connection.connection.startSession()
                .then((s) => {
                    console.log("Session started");
                    return s
                })
                .catch((e) => {
                    console.log("Failed to start session", e)
                    return null;
                });

            if (!session)
                return NextResponse.json({ success: false, errCode: "uncaught_error" });


            console.log("Starting transaction");
            session.startTransaction();

            console.log("Entering Handler");
            const { errCode, success, available, options, files, revalidateQueue } =
                await handler({
                    req,
                    user_id,
                    params: await params,
                    username,
                    session,
                    profile: profile?.path,
                });

            console.log("Out of handler with success:", success);


            if (success) {

                if (files) {
                    console.log("Deleting files");

                    await deleteFiles(files);
                }

                console.log("Commiting transaction");

                await session.commitTransaction();

                if (revalidateQueue && revalidateQueue.length) {
                    revalidateTags.concat(revalidateQueue);
                } else if (available && options) {
                    revalidateTags.concat(getRevalidateTags(available, options));
                }

            } else {
                console.log("Aborting transaction");

                await session.abortTransaction().catch(console.error);
            }

            return NextResponse.json({ success, errCode });
        } catch (err: any) {
            console.log("Entered catch block, aborting transaction");

            await session?.abortTransaction().catch(console.error);
            console.error("Error occured while deleting resource", err.message);
            return NextResponse.json({
                success: false,
                errCode: "unknown_error",
            });
        } finally {
            session?.endSession();
            console.log("revalidateTags", revalidateTags);
            revalidateTags.forEach((tag) => updateTag(tag));
        }
    };
};

export const updateHandler = <T extends HandlerData>({ handler, preCheck, schema, skipUserCheck }: {
    handler: (args: MutationHandlerFunctionParams<T> & { areFilesToDelete: boolean }) => Promise<HandlerResponse>;
    preCheck?: PrecheckFunction<T>;
    schema?: ZodObject;
    skipUserCheck?: boolean;
}) => {
    return async (req: NextRequest, { params }: { params: Promise<HandlerParamVariable> }) => {
        console.log("Entered Update Handler", "skipUser=", skipUserCheck);

        // Checking if there is a current user and taking it's user_id and username
        const payload = skipUserCheck ? null : await getUserFromToken(req.cookies);
        const awaitedParams = await params;

        if (!(skipUserCheck || payload)) return NextResponse.json(
            {
                success: false,
                errCode: "unauthenticated_access",
                result: null,
            },
            { status: 401 }
        );

        const user_id = payload?.user_id || "";
        const username = payload?.username || "";
        const profile = payload?.profile;

        console.log("Looking to get data from formdata");
        const response = await getDataFromRequest<T>(req, schema);

        console.log("Successfully got data", response);

        if (!response.success) return NextResponse.json(response, { status: 402 });

        const data = response.result;

        let revalidateTags: string[] = [];
        let frames: Frame[] = [];
        let session: ClientSession | null = null;
        try {
            console.log("Connecting to database");

            const connection = await connectDatabase();

            if (!connection) return NextResponse.json({
                result: null,
                success: false,
                errCode: "database_connection_fail",
            });

            console.log("starting session");

            session = await connection.connection.startSession()
                .then((s) => {
                    console.log("Session started");
                    return s
                })
                .catch((e) => {
                    console.log("Failed to start session", e)
                    return null;
                });

            if (!session)
                return NextResponse.json({ success: false, errCode: "uncaught_error" });


            // Some pre-checking eg: if the user is authorized to do this specific thing or not
            if (preCheck) {
                console.log("Entering Precheck");

                const { errCode, success } = await preCheck({
                    data,
                    params: awaitedParams,
                    req,
                    user_id,
                    username,
                });

                console.log("Out of precheck with success:", success, errCode);

                if (!success)
                    return NextResponse.json({ success, errCode }, { status: 500 });
            }

            const { files, filesData, filesToRemove, ...rest } = data;
            let isNsfw = false;

            if (filesData && filesData.length) {
                console.log("Uploading files");

                const res = await uploadFiles(files ?? [], filesData, !data.nsfw)
                frames = res.frames;
                isNsfw = Boolean(res.isNsfw)
            }

            console.log("Starting transaction");

            session.startTransaction();

            console.log("Entering handler");

            const { available, errCode, options, result, success, revalidateQueue, warnTeamParlocula } =
                await handler({
                    data: rest,
                    isNsfw,
                    frames,
                    user_id,
                    username,
                    profile: profile?.path,
                    session,
                    req,
                    params: awaitedParams,
                    areFilesToDelete: Boolean(filesToRemove && filesToRemove.length)
                });

            console.log("Out of handler with success:", success);

            if (success) {
                console.log("Updating quota limit");

                await updateQuotaLimit(req, user_id);

                if (warnTeamParlocula) {
                    console.log("about to warn creators.");

                    await sendEmail({
                        email: process.env.CREATOR_EMAIL!,
                        subject: "Warning from Parlocula",
                        template: await render(WarnTeamParlocula(warnTeamParlocula))
                    });
                }

                if (filesToRemove) {
                    console.log("about to delete files to remove");

                    await deleteFiles(filesToRemove);
                }

                if (revalidateQueue && revalidateQueue.length) {
                    revalidateTags.concat(revalidateQueue);
                } else if (available && options) {
                    revalidateTags.concat(getRevalidateTags(available, options));
                }

                console.log("commiting transaction");
                await session.commitTransaction();

            } else {
                console.log("about to delete files");

                await deleteFiles(frames);

                console.log("aborting transaction");
                await session.abortTransaction().catch(console.error);
            }

            return NextResponse.json(
                { result, success, errCode },
                { status: success ? 200 : 500 }
            );

        } catch (err: any) {
            console.log("Entered catch block, aborting transaction");

            await session?.abortTransaction().catch(console.error);

            console.error(
                `Error occured at path ${req.nextUrl.pathname} while updating data`,
                err.message
            );

            console.log("deleting files");

            await deleteFiles(frames);
            console.log("files deleted");

            return NextResponse.json(
                {
                    result: null,
                    success: false,
                    errCode: "unknown_error",
                },
                { status: 500 }
            );
        } finally {
            session?.endSession();
            console.log("revalidateTags", revalidateTags);
            revalidateTags.forEach((tag) => updateTag(tag));
        }
    };
};
