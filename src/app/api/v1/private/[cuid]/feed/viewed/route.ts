import { HandlerParamVariable } from "@lib/backend/helpers/handlers";
import { getRedis } from "@lib/backend/providers/redis";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest, { params }: { params: Promise<HandlerParamVariable> }) => {

    const data = await req.json() as { posts: string[] };

    const { cuid } = await params;
    try {

        const redis = await getRedis();
        const pipeline = redis.multi();

        pipeline.zadd(`feed:${cuid}:viewed`, ...data.posts);
        pipeline.zrem(`feed:${cuid}`, ...data.posts);

        await pipeline.exec();

        return NextResponse.json({ success: true, result: null }, { status: 200 })

    } catch (e: any) {
        console.warn("Error occured while updating user viewed feed posts");
        return NextResponse.json({ success: false, errCode: "uncaught_error" }, { status: 500 })
    }

}