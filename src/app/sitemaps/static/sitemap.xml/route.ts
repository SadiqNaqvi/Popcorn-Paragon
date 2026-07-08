import { app_production_url } from "@lib/constants";
import { MetadataRoute } from "next";

const buildSitemaps = (sitemaps: MetadataRoute.Sitemap) => {

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    for (const sitemap of sitemaps) {
        xml += "<url>";
        xml += `<loc>${sitemap.url}</loc>`;

        if (sitemap.lastModified)
            xml += `<lastmod>${sitemap.lastModified}</lastmod>`;
        if (sitemap.priority)
            xml += `<priority>${sitemap.priority}</priority>`;
        if (sitemap.changeFrequency)
            xml += `<changefreq>${sitemap.changeFrequency}</changefreq>`;
        xml += "</url>";
    }

    xml += "</urlset>";
    return xml;

}

// Cache it for a week;
export const revalidate = 604800;

export const GET = () => {

    const sitemaps = buildSitemaps([
        {
            url: app_production_url,
            priority: 1,
            lastModified: new Date().toISOString(),
            changeFrequency: "always",
        },
        {
            url: `${app_production_url}/join`,
            priority: 0.9,
            lastModified: new Date().toISOString(),
        },
        {
            url: `${app_production_url}/thread`,
            priority: 0.8,
            changeFrequency: "daily",
        },
        {
            url: `${app_production_url}/shelf`,
            priority: 0.8,
            changeFrequency: "daily",
        },
        {
            url: `${app_production_url}/explore`,
            priority: 0.7,
            lastModified: new Date().toISOString(),
        },
        {
            url: `${app_production_url}/explore/search`,
            priority: 0.7,
            lastModified: new Date().toISOString(),
        },
        {
            url: `${app_production_url}/home`,
            priority: 0.7,
            lastModified: new Date().toISOString(),
        },
        {
            url: `${app_production_url}/app/about`,
            priority: 0.7,
        },
        {
            url: `${app_production_url}/app/privacy_policy`,
            priority: 0.5,
        },
        {
            url: `${app_production_url}/app/terms_and_conditions`,
            priority: 0.5,
        },
    ]);

    return new Response(sitemaps, {
        headers: {
            "Content-Type": "application/xml",
            "Content-Length": Buffer.byteLength(sitemaps).toString(),
        },
    });

}