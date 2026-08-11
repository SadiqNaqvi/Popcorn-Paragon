import { app_production_url } from "@lib/shared/constants";
import { getPoster } from "@lib/shared/utils";
import { RefinedCollectionData, RefinedMovieData, RefinedPersonData, RefinedShowData } from "@type/external";
import { FullComment, FullPost, FullShelf, RequestedUser, ShelfItemType, Thread } from "@type/internal";
import { description, name, title } from "./metadata";

export const generateJsonLdForRoot = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": name,
    "url": app_production_url,
    "description": description,
    "alternateName": title,
});

export const generateJsonLdForMovie = ({
    overview, poster, release_date, title, directors, cast, awards, writers, rated, tmdb_id, imdb_id,
}: RefinedMovieData) => ({
    schema: {
        "@context": "https://schema.org",
        "@type": "Movie",

        "url": `${app_production_url}/explore/movie/${tmdb_id}`,

        "name": title,
        "image": getPoster({ path: poster, external: true, type: "poster", size: "w500" }),
        "datePublished": new Date(release_date).toISOString(),
        "description": overview,
        "awards": awards,
        "contentRating": rated,

        "sameAs": [
            `https://www.themoviedb.org/movie/${tmdb_id}`,
            `https://www.imdb.com/title/${imdb_id}`,
        ],

        "identifier": tmdb_id,

        "director": directors.map(({ name }) => ({
            "@type": "Person",
            "name": name
        })),
        "creator": writers.map(({ name }) => ({
            "@type": "Person",
            "name": name
        })),
        "actor": cast.map(({ name }) => ({
            "@type": "Person",
            "name": name,
        })),

    },
    breadcrumbs: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${app_production_url}/home`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Explore",
                "item": `${app_production_url}/explore`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
                "item": `${app_production_url}/explore/movie/${tmdb_id}`
            }
        ]
    }
});

export const generateJsonLdForShow = ({
    overview, poster, release_date, title, directors, cast, awards, writers, rated, number_of_seasons, seasons, tmdb_id, imdb_id
}: RefinedShowData) => ({
    schema: {
        "@context": "https://schema.org",
        "@type": "TVSeries",

        "url": `${app_production_url}/explore/show/${tmdb_id}`,

        "name": title,
        "image": getPoster({ path: poster, external: true, type: "poster", size: "w500" }),
        "datePublished": new Date(release_date).toISOString(),
        "description": overview,
        "awards": awards,
        "contentRating": rated,

        "sameAs": [
            `https://www.themoviedb.org/tv/${tmdb_id}`,
            `https://www.imdb.com/title/${imdb_id}`,
        ],

        "identifier": tmdb_id,

        "director": directors.map(({ name }) => ({
            "@type": "Person",
            "name": name
        })),
        "creator": writers.map(({ name }) => ({
            "@type": "Person",
            "name": name
        })),
        "actor": cast.map(({ name }) => ({
            "@type": "Person",
            "name": name,
        })),

        "numberOfSeasons": number_of_seasons,

        "containsSeason": seasons.map(season => ({
            "@type": "TVSeason",
            "name": season.title,
            "numberOfEpisodes": season.episode_count,
            "description": season.overview,
            "image": getPoster({ path: season.poster, external: true, type: "poster", size: "w500" })
        }))
    },
    breadcrumbs: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${app_production_url}/home`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Explore",
                "item": `${app_production_url}/explore`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
                "item": `${app_production_url}/explore/show/${tmdb_id}`
            }
        ]
    }
});

export const generateJsonLdForArtist = ({
    name, biography, department, profile, tmdb_id
}: RefinedPersonData) => ({
    schema: {
        "@context": "https://schema.org",
        "@type": "Person",

        "url": `${app_production_url}/explore/artist/${tmdb_id}`,

        "name": name,
        "image": getPoster({ path: profile, external: true, type: "poster", size: "w500" }),
        "description": biography,
        "jobTitle": department,

        "identifier": tmdb_id,

        "sameAs": [
            `https://www.themoviedb.org/artist/${tmdb_id}`
        ]
    },
    breadcrumbs: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${app_production_url}/home`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Explore",
                "item": `${app_production_url}/explore`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": name,
                "item": `${app_production_url}/explore/artist/${tmdb_id}`
            }
        ]
    }
});

export const generateJsonLdForCollection = ({
    title, parts, poster, tmdb_id
}: RefinedCollectionData) => ({
    schema: {
        "@context": "https://schema.org",
        "@type": "ItemList",

        "url": `${app_production_url}/explore/collection/${tmdb_id}`,

        "name": title,
        "image": getPoster({ path: poster, external: true, type: "poster", size: "w500" }),
        "numberOfItems": parts.length,

        "identifier": tmdb_id,

        "sameAs": [
            `https://www.themoviedb.org/collection/${tmdb_id}`
        ],

        "itemListElement": parts.map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "image": getPoster({ path: p.poster, external: true, type: "poster", size: "w500" }),
            "url": `${app_production_url}/${p.type}/${p.id}`,
        }))
    },
    breadcrumbs: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${app_production_url}/home`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Explore",
                "item": `${app_production_url}/explore`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
                "item": `${app_production_url}/explore/collection/${tmdb_id}`
            }
        ]
    }
});

export const generateJsonLdForUser = ({
    username, profile, bio, bioLinks, posts, following, name
}: RequestedUser) => ({
    schema: {
        "@context": "https://schema.org",
        "@type": "ProfilePage",

        "url": `${app_production_url}/u/${username}`,

        "mainEntity": {
            "@type": "Person",

            "name": name || username,
            "description": bio,
            "identifier": username,

            ...(profile && { "image": profile }),
            ...(!!bioLinks.length && {
                "sameAs": bioLinks.map(({ path }) => path),
            }),

        }
    },
    breadcrumbs:
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${app_production_url}/home`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": name,
                "item": `${app_production_url}/u/${username}`
            },
        ]
    }
});

export const generateJsonLdForPost = ({
    title, frames, username, body, thread_name, category, createdAt, updatedAt, thread_id, _id, poster, quoted_post_title, quoted_post_id,
}: FullPost) => {

    const image = frames.find(f => f.type === "image");

    return {
        schema: {
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",

            "datePublished": new Date(createdAt).toISOString(),
            "dateModified": new Date(updatedAt).toISOString(),

            "headline": title,
            ...(image && { "image": image }),

            "author": {
                "@type": "Person",
                "name": username,
                "url": `${app_production_url}/u/${username}`,
            },

            "genre": category || thread_name,

            "isPartOf": {
                "@type": "WebPage",
                "name": thread_name,
                "url": `${app_production_url}/t/${thread_id}`,
            },

            "url": `${app_production_url}/p/${_id}`,

            "articleBody": body,
        },
        breadcrumbs: {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": `${app_production_url}/home`
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Thread",
                    "item": `${app_production_url}/thread`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": thread_name,
                    "item": `${app_production_url}/t/${thread_id}`
                },
                ...(quoted_post_id ? [{
                    "@type": "ListItem",
                    "position": 3,
                    "name": "Parent Post",
                    "item": `${app_production_url}/p/${quoted_post_id}`
                }] : []),
                {
                    "@type": "ListItem",
                    "position": quoted_post_id ? 4 : 3,
                    "name": title,
                    "item": `${app_production_url}/p/${_id}`
                }
            ]
        }
    }
}

export const generateJsonLdForShelf = ({
    username, createdAt, _id, poster, name, item_count
}: FullShelf, items: ShelfItemType[]) => ({
    schema: {
        "@context": "https://schema.org",
        "@type": "ItemList",

        "name": name,
        "author": {
            "@type": "Person",
            "name": username
        },
        "datePublished": new Date(createdAt).toISOString(),

        "url": `${app_production_url}/s/${_id}`,

        ...(poster && {
            "image": getPoster({ path: poster, external: true, type: "poster", size: "w300" })
        }),

        ...(item_count && { "numberOfItems": item_count }),

        ...(items && items.length && {
            "itemListElement": items.map((item, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": item.taleon_type === "movie" ? "Movie" : "TVSeries",
                    "url": `${app_production_url}/explore/${item.taleon_type}/${item.ext_id}`,
                    "name": item.title,
                    ...(item.poster && {
                        "image": getPoster({ path: item.poster, external: true, type: "poster", size: "w300" })
                    }),
                    "dateCreated": new Date(item.createdAt).toISOString(),
                }
            })
            )
        })

    },
    breadcrumbs: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${app_production_url}/home`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Shelf",
                "item": `${app_production_url}/shelf`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": name,
                "item": `${app_production_url}/s/${_id}`
            }
        ]
    }
})

export const generateJsonLdForThread = ({
    _id, createdAt, created_by, description, name, poster
}: Thread) => ({
    schema: {
        "@context": "https://schema.org",
        "@type": "WebPage",

        "name": name,
        "description": description,
        "datePublished": new Date(createdAt).toISOString(),
        "author": {
            "@type": "Person",
            "name": created_by
        },

        "url": `${app_production_url}/t/${_id}`,

        ...(poster && {
            "image": getPoster({ path: poster.path, external: false, extSource: poster.extSource })
        })
    },
    breadcrumbs: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${app_production_url}/home`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Thread",
                "item": `${app_production_url}/thread`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": name,
                "item": `${app_production_url}/t/${_id}`
            }
        ]
    }
});

export const generateJsonLdForComment = ({
    _id, content, createdAt, username, profile, replied_to, post_id
}: FullComment) => ({
    schema: {
        "@context": "https://schema.org",
        "@type": "Comment",

        "text": content,
        "author": {
            "@type": "Person",
            "name": username,
            ...(profile && {
                "image": getPoster({ path: profile.path, external: false, extSource: profile.extSource })
            }),
        },
        "datePublished": new Date(createdAt).toISOString()
    },
    breadcrumbs: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Post",
                "item": `${app_production_url}/p/${post_id}`
            },
            ...(replied_to ? [{
                "@type": "ListItem",
                "position": 2,
                "name": "Parent Comment",
                "item": `${app_production_url}/c/${replied_to}`
            }] : []),
            {
                "@type": "ListItem",
                "position": replied_to ? 3 : 2,
                "name": "Comment",
                "item": `${app_production_url}/c/${_id}`
            }
        ]
    }
});

//         <script
//         type= "application/ld+json"
//     dangerouslySetInnerHTML = {{
//         __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
//         }
// }
//       />