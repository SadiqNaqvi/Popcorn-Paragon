import { oneDayInSeconds } from "@lib/shared/constants";
import { getRedis } from "@lib/backend/providers/redis";
import { handlePipelineResponse } from "@lib/backend/redis/utils";
import { NextRequest } from "next/server";

export type RateLimitResult = {
    allowed: boolean;
    remaining: number;        // how many allowed left in window
    resetIn: number;          // seconds until earliest event expires
    current: number;          // current count
};

type Mapping = Record<string, string>
type LimitBucket = Record<string, { max: number, window: number }>

const ACTION_BUCKET_MAP: Mapping = {
    "POST:bookmark": "SOCIAL_INTERACTION",

    "POST:comment": "CONTENT_CREATION",
    "PATCH:comment": "CONTENT_CREATION",
    "POST:comment:like": "SOCIAL_INTERACTION",

    "POST:post": "CONTENT_CREATION",
    "PATCH:post": "CONTENT_CREATION",
    "POST:post:reaction": "SOCIAL_INTERACTION",

    "POST:room": "ROOM_MANAGEMENT",
    "PATCH:room": "ROOM_MANAGEMENT",
    "POST:room:message": "MESSAGING",
    "POST:room:participant:invite": "ROOM_MANAGEMENT",
    "POST:room:participant:remove": "ROOM_MANAGEMENT",
    "PATCH:room:hide": "ROOM_MANAGEMENT",
    "PATCH:room:notification": "ROOM_MANAGEMENT",

    "POST:shelf": "SHELF_MANAGEMENT",
    "POST:item": "SHELF_MANAGEMENT",
    "POST:shelf:collaborators": "SHELF_MANAGEMENT",
    "PATCH:shelf:collaborators": "SHELF_MANAGEMENT",
    "POST:shelf:collaborate": "SHELF_MANAGEMENT",

    "POST:thread": "CONTENT_CREATION",
    "PATCH:thread": "CONTENT_CREATION",
    "POST:thread:banned": "THREAD_MODERATION",
    "PATCH:thread:banned": "THREAD_MODERATION",
    "POST:thread:managers": "THREAD_MODERATION",
    "PATCH:thread:managers": "THREAD_MODERATION",
    "POST:thread:member": "THREAD_MODERATION",
    "PATCH:thread:member": "THREAD_MODERATION",

    "POST:register": "AUTH",
    "POST:user:login": "AUTH",
    "PATCH:user:creds": "AUTH",
    "PATCH:user": "PROFILE",

    "POST:user:follow": "SOCIAL_INTERACTION",
    "PATCH:user:follow": "SOCIAL_INTERACTION",
    "POST:user:block": "SOCIAL_INTERACTION",

    "POST:report": "REPORTING",
};

const BUCKET_LIMITS: LimitBucket = {
    AUTH: { max: 5, window: 60 },
    PROFILE: { max: 5, window: 60 },
    SOCIAL_INTERACTION: { max: 30, window: 60 },
    CONTENT_CREATION: { max: 5, window: 60 },
    MESSAGING: { max: 20, window: 60 },
    ROOM_MANAGEMENT: { max: 5, window: 60 },
    SHELF_MANAGEMENT: { max: 5, window: 60 },
    THREAD_MODERATION: { max: 3, window: 60 },
    REPORTING: { max: 10, window: 3600 },
};

const QUOTA_BUCKET_MAP: Mapping = {
    "POST:thread": "THREAD_CREATION",
    "PATCH:thread": "THREAD_UPDATE",
    "POST:register": "ACCOUNT_CREATION",
    "POST:post": "POST_CREATION",
    "POST:room": "ROOM_CREATION",
    "POST:shelf": "SHELF_CREATION",
    "PATCH:user:creds:username": "USERNAME_UPDATE",
    "PATCH:user:creds:email": "EMAIL_UPDATE",
}

const QUOTA_LIMITS: LimitBucket = {
    THREAD_CREATION: { max: 1, window: oneDayInSeconds },
    THREAD_UPDATE: { max: 1, window: oneDayInSeconds },
    ACCOUNT_CREATION: { max: 2, window: oneDayInSeconds },
    POST_CREATION: { max: 10, window: oneDayInSeconds },
    ROOM_CREATION: { max: 10, window: oneDayInSeconds },
    SHELF_CREATION: { max: 10, window: oneDayInSeconds },
    EMAIL_UPDATE: { max: 1, window: oneDayInSeconds * 7 },
    USERNAME_UPDATE: { max: 1, window: oneDayInSeconds * 7 },
}

const STATIC_SEGMENTS = new Set([
    "post", "comment", "room", "thread", "user", "report",
    "bookmark", "shelf", "item",
    "reaction", "like", "follow", "block", "invite", "remove",
    "message", "member", "participant", "collaborators",
    "banned", "managers", "hide", "login", "register",
    "creds", "collaborate"
]);

const isProbablyId = (segment: string) => {
    if (/^[0-9a-fA-F]{24}$/.test(segment)) return true;
    if (/^\d+$/.test(segment)) return true;
    if (/^[a-zA-Z0-9_-]{10,15}$/.test(segment)) return true;
    return false;
}

export const getActionKey = (req: NextRequest) => {
    const method = req.method.toUpperCase();
    const paths = req.nextUrl.pathname.split("/private/")[1]?.split("/");
    if (!paths || !paths.length) return;

    const segments = paths.filter(Boolean);

    const normalized = segments.filter((segment) => {
        if (STATIC_SEGMENTS.has(segment)) return true;
        return !isProbablyId(segment);
    });

    return `${method}:${normalized.join(":")}`;
}

const responseForNonLimit = {
    allowed: true,
    remaining: 0,
    current: 0,
    resetIn: 0
}

/**
 * slidingWindowRateLimit:
 * - Uses a ZSET with timestamps (ms) as score/member.
 * - On each request:
 *   1. ZREMRANGEBYSCORE older-than-window
 *   2. ZADD now
 *   3. ZCARD to count
 *   4. EXPIRE set to windowSeconds (for auto cleanup)
 *
 * Returns allowed boolean and metadata.
 */

export const slidingWindowRateLimit = async (req: NextRequest, unique_id: string): Promise<RateLimitResult> => {
    const now = Date.now();

    const action = getActionKey(req);

    if (!action) return responseForNonLimit;

    const bKey = ACTION_BUCKET_MAP[action];

    const limits = BUCKET_LIMITS[bKey];

    console.log(action, bKey, limits);

    if (!limits) return responseForNonLimit;

    const qKey = QUOTA_BUCKET_MAP[action];
    const quota = QUOTA_LIMITS[qKey];
    const userBucketKey = `${bKey}:${unique_id}`;
    const userQuotaKey = `${qKey}:${unique_id}`;
    const { max, window } = BUCKET_LIMITS[bKey];
    const windowStart = now - window * 1000;

    const redis = await getRedis();
    const pipeline = redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(userBucketKey, 0, windowStart);

    // Add current event with score = now (use unique member using timestamp+random to avoid collisions)
    const member = `${now}-${Math.random().toString(36).slice(2, 9)}`;
    pipeline.zadd(userBucketKey, now, member);
    pipeline.zcard(userBucketKey);
    pipeline.zrange(userBucketKey, 0, 0);
    if (quota) {
        pipeline.get(userQuotaKey);
    }

    // set expire so idle keys are removed
    pipeline.expire(userBucketKey, window + 2);

    // Get current count and earliest timestamp to compute reset
    const [, , count, earliest, actionQuota] = await pipeline.exec().then(handlePipelineResponse) as [any, any, number, string[], number];

    if (quota && actionQuota && typeof actionQuota === "number" && actionQuota >= quota.max) return {
        allowed: false,
        remaining: 0,
        current: actionQuota,
        resetIn: quota.window
    }

    let earliestTs = now;
    if (earliest && earliest.length > 0) {
        // earliest member format: <timestamp>-<rand>
        const tsStr = earliest[0].split("-")[0];
        earliestTs = parseInt(tsStr, 10);
    }

    const remaining = Math.max(max - count, 0);
    const resetIn = Math.max(0, Math.ceil((earliestTs + window * 1000 - now) / 1000));

    return {
        allowed: count <= max,
        remaining,
        resetIn,
        current: count,
    };
}

export const checkCooldownState = async (uid: string) => {
    const redis = await getRedis();
    return await redis.get(`cooldown:${uid}`);
}

export const updateQuotaLimit = async (req: NextRequest, uid: string) => {

    const actionKey = getActionKey(req);

    if (!actionKey) return responseForNonLimit;

    const action = QUOTA_BUCKET_MAP[actionKey];
    if (!action) return;
    const { window } = QUOTA_LIMITS[action];

    const redis = await getRedis();
    const key = `${action}:${uid}`;
    const count = await redis.incr(key);

    if (count === 1) {
        await redis.expire(key, window);
    }

}