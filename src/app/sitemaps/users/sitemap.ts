import { app_production_url } from "@lib/shared/constants";
import { User } from "@model";
import { MetadataRoute } from "next";
import { connectDatabase } from "@lib/backend/providers/database";

export const generateSitemaps = async () => {
    await connectDatabase();
    const count = await User.countDocuments();

    return Array.from(
        { length: Math.ceil(count / 50000) },
        (_, id) => ({ id })
    );
}

const sitemap = async ({ id }: { id: number }): Promise<MetadataRoute.Sitemap> => {
    const users = await User.find<{ username: string, updatedAt: number }>()
        .skip(id * 50000)
        .limit(50000)
        .select({ username: 1, updatedAt: 1 })
        .exec();

    return users.map(user => ({
        url: `${app_production_url}/u/${user.username}`,
        lastModified: new Date(user.updatedAt).toISOString(),
        changeFrequency: "daily",
        priority: 0.8
    }));
}

export default sitemap;