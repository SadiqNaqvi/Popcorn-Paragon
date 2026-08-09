import { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/api/",
                "/settings/",
                "/notifications/",
                "/room/",
                "/join/",
                "/invalidate/",
                "/guest/",
                "/new/",
                "/edit/",
                "/collaborators/",
                "/collaborate/",
                "/invited/",
                "/private/",
                "/created/",
                "/joined/",
                "/manages/",
                "/explore/artist/",
                "/explore/movie/",
                "/explore/show/",
            ],
        },
        sitemap: "https://parlocula.vercel.app/sitemap.xml",
    };
}

export default robots;