import { getUserMetaFromCache } from "@lib/backend/redis/messaging";

// Get User Metadata of a user {_id, username, profile}
export const GET = async (r: any, { params }: { params: Promise<{ ruid: string }> }) => {

    const { ruid } = await params;

    try {
        return {
            success: true,
            result: await getUserMetaFromCache(ruid),
        }
    } catch (e: any) {
        console.warn("Error occured while fetching user metadata", e.message);
        return { success: false, errCode: "unknown_error" };
    }
}