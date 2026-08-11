import { getHandler } from "@lib/backend/helpers/handlers";
import { searchHandler } from "@lib/backend/helpers/pipelines";
import { NextRequest } from "next/server";

export const GET = getHandler(async (r: NextRequest) =>
  searchHandler({ r, filters: [], type: "shelves" })
);
