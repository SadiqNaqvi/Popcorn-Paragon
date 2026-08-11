import { app_production_url } from "@lib/shared/constants";
import type { Metadata, Viewport } from "next";

const appURL = app_production_url;

const ogImagePath = "/og-image.png";

export const title = "Parlocula - The Cinematic Planet";
export const name = "Parlocula"

export const description = "Parlocula is The Cinematic Planet where movies and shows stay alive through people. Collect taleons into shelves, join meaningful threads, and live the moment after the credits roll."
const shortDescription = "Where cinema lives beyond the screen. Explore taleons, build shelves, and join conversations that keep stories alive."

const robotsMeta: Metadata["robots"] = {
    index: true,
    follow: true,
    googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
    },
};

const ogImage = {
    url: ogImagePath,
    width: 1200,
    height: 630,
    alt: title,
}

const openGraph = {
    type: "website",
    url: appURL,
    title,
    description: shortDescription,
    siteName: name,
    images: [ogImage],
}

const twitterCard = {
    title,
    description: "Live the moment after the credits roll. A dedicated world for cinema, collections, and conversation.",
    images: [ogImagePath],
    card: "summary_large_image",
}


export const metadata: Metadata = {
    title: {
        default: title,
        template: "%s · Parlocula",
    },

    description,
    appleWebApp: {
        capable: true,
        startupImage: "/android-chrome-192x192.png",
        statusBarStyle: "default",
        title: "Parlocula",
    },
    keywords: [
        "cinema community",
        "movie discussion platform",
        "film culture",
        "cinematic universe",
        "movie shelves",
        "cinema conversations",
        "Parlocula",
    ],

    robots: robotsMeta,

    alternates: {
        canonical: appURL,
    },

    openGraph,

    twitter: twitterCard,

    metadataBase: new URL(appURL),
    icons: {
        apple: "/apple-touch-icon.png",
        icon: [
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        other: [
            {
                rel: "icon",
                url: "/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                rel: "icon",
                url: "/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ]
    },
    manifest: "/manifest.json"
};

type ParloMetadata = {
    title: string,
    coverImage: string,
    description: string,
    shortDescription: string,
    authors: Metadata["authors"],
    allowRobots?: boolean,
    url: string,
}

const generateDynamicMetadata = (config: Partial<ParloMetadata>, root?: boolean): Metadata => {

    const titleForThePage = config.title || title;
    const descriptionForThePage = config.description || description;
    const shortDescriptionForThePage = config.shortDescription || shortDescription;
    const coverImage = config.coverImage || ogImagePath;
    const canonical = new URL(config.url || '', appURL);

    return {
        title: root || config.title ? {
            default: titleForThePage,
            template: "%s | Parlocula - The Cinematic Planet",
        } : title,

        description: descriptionForThePage,
        appleWebApp: {
            capable: true,
            startupImage: "/android-chrome-192x192.png",
            statusBarStyle: "default",
            title: "Parlocula",
        },

        robots: config.allowRobots ? robotsMeta : undefined,

        alternates: { canonical },

        openGraph: {
            ...openGraph,
            images: [{
                ...ogImage,
                url: coverImage,
                alt: titleForThePage,
            }]
        },

        twitter: {
            ...twitterCard,
            title: titleForThePage,
            images: [coverImage],
            description: shortDescriptionForThePage,
        },

        metadataBase: new URL(appURL),
        icons: {
            apple: "/apple-touch-icon.png",
            icon: [
                { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
                { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            ],
            other: [
                {
                    rel: "icon",
                    url: "/android-chrome-192x192.png",
                    sizes: "192x192",
                    type: "image/png",
                },
                {
                    rel: "icon",
                    url: "/android-chrome-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                },
            ]
        },
        manifest: "/manifest.json",
        verification: {
            google: "X7wLjElVSSkEDTG5XIb7-u1ZTenE_gW4wuqn4rlHEJI",
            other: {
                "msvalidate.01":"AE31728D793BC151F732BB2746ED0A34"
            }
        }
    };
}

export const appViewport: Viewport = {
    viewportFit: "contain",
    colorScheme: "dark",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#000000",
}

export default generateDynamicMetadata;