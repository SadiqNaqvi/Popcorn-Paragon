import { getHandler } from "@lib/backend/helpers/handlers";
import { searchHandler } from "@lib/backend/helpers/pipelines";

export const GET = getHandler(async (r) =>
    await searchHandler({ r, filters: [], type: "posts" })
);
