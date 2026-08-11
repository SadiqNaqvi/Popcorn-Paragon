"use client";
import { InfiniteScroller, Navbar } from "@components";
import { CommentBar, PostBar } from "@components/ui";
import ShelfBar from "@components/ui/ShelfBar";
import { getSavedContent } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";

const SavedSection = ({ type, uid }: { type: "post" | "comment" | "shelf", uid: string }) => {

    const Component =
        type === "post" ? PostBar
            : type === "comment" ? CommentBar
                : ShelfBar;

    return (
        <>
            <Navbar navTitle={`Saved ${type}`} />
            <section>
                <InfiniteScroller
                    Component={Component}
                    fetchData={(p) => getSavedContent(uid, type, p)}
                    queryKeys={getQueryKeys(`saved-${type}s_uid`, { uid })}
                    notFoundMessage={{
                        title: "Oops! Looks like The Parlocula Explorers couldn't find anything",
                        paras: [`Save a ${type} to see it here`],
                    }}
                />
            </section>
        </>
    )
}

export default SavedSection;