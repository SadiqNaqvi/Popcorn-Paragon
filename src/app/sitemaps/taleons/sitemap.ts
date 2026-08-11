import { app_production_url } from "@lib/shared/constants";
import { Taleon } from "@model";
import { TaleonModelType } from "@type/models";
import { MetadataRoute } from "next";
import { connectDatabase } from "@lib/backend/providers/database";

export const generateSitemaps = async () => {
    await connectDatabase();
    const count = await Taleon.countDocuments();

    return Array.from(
        { length: Math.ceil(count / 50000) },
        (_, id) => ({ id })
    );
}

const sitemap = async ({ id }: { id: number }): Promise<MetadataRoute.Sitemap> => {
    const taleons = await Taleon.find<TaleonModelType & { updatedAt: number }>()
        .skip(id * 50000)
        .limit(50000)
        .select({ updatedAt: 1, taleon_type: 1, ext_id: 1 })
        .exec();

    return taleons.map(taleon => ({
        url: `${app_production_url}/explore/${taleon.taleon_type}/${taleon.ext_id}`,
        lastModified: new Date(taleon.updatedAt || Date.now()).toISOString(),
        changeFrequency: "weekly",
        priority: 0.8
    }));
}

export default sitemap;