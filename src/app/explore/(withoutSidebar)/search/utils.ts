
import { searchAllContent, searchCollection, searchCompany, searchMovie, searchPerson, searchShow } from "@lib/shared/helpers/external_fetchers";
import { searchComments, searchPosts, searchShelves, searchThreads, searchUsers } from "@lib/shared/helpers/internal_fetchers";

export const getQueryFnForSearch = (tab: string, nsfw: boolean) => {

    switch (tab) {
        case "all": return searchAllContent;
        case "movies": return searchMovie;
        case "people": return searchPerson;
        case "shows": return searchShow;
        case "collections": return searchCollection;
        case "companies": return searchCompany;
        case "posts": return (q: string, p: number) => searchPosts(q, nsfw, p);
        case "comments": return (q: string, p: number) => searchComments(q, nsfw, p);
        case "shelves": return searchShelves;
        case "threads": return (q: string, p: number) => searchThreads(q, nsfw, p);
        case "users": return searchUsers;
        default: return (q: string, p: number) => ({ success: false, errCode: "uncaught_error", result: undefined } as any)
    }

}