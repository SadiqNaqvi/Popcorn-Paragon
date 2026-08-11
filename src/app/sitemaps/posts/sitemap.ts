import { app_production_url } from "@lib/shared/constants";
import { connectDatabase } from "@lib/backend/providers/database";
import { Post } from "@model";
import { GenericDate } from "@type/internal";
import { PostModelType } from "@type/models";
import { MetadataRoute } from "next";
import { Videos } from "next/dist/lib/metadata/types/metadata-types";

export const generateSitemaps = async () => {
    await connectDatabase();
    const count = await Post.countDocuments();

    return Array.from(
        { length: Math.ceil(count / 50000) },
        (_, id) => ({ id })
    );
}

const sitemap = async ({ id }: { id: number }): Promise<MetadataRoute.Sitemap> => {
    const posts = await Post.find<PostModelType & { updatedAt: GenericDate }>()
        .skip(id * 50000)
        .limit(50000)
        .select({ _id: 1, updatedAt: 1, frames: 1 })
        .exec();

    return posts.map(post => {

        let images: string[] = [];
        let videos: Videos[] = [];

        if (post.frames && post.frames.length) {
            post.frames.forEach(frame => {
                if (frame.type === "image") {
                    images.push(frame.path);
                } else {
                    if (!frame.isExternal && frame.thumb) {
                        videos.push({
                            title: post.title,
                            description: post.body,
                            thumbnail_loc: frame.thumb,
                            duration: frame.duration,
                            family_friendly: post.nsfw ? "no" : "yes",
                            tag: post.title.split(' ').concat(post.body?.slice(0, 100).split(' ') || []).join()
                        })
                    }
                }
            });

        }

        return {
            url: `${app_production_url}/p/${post._id}`,
            lastModified: new Date(post.updatedAt).toISOString(),
            changeFrequency: "daily",
            priority: 0.8,
            images,
            videos
        }
    });
}

export default sitemap;