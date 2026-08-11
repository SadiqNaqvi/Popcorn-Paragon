"use client";

import { LeftChevron, SearchIcon } from "@assets/Icons";
import { Form, Input } from "@components/form";
import Navigate from "@components/Navigate";
import { Button } from "@components/ui";
import { searchFilters } from "@lib/shared/constants";
import { useChageSearchParams, useSearchHistoryStack } from "@lib/frontend/hooks";
import { SearchHistoryStackType } from "@type/other";

const SearchHeader = ({ filter }: { filter: string }) => {

    const { addToSearchParams, removeFromSearchParams, searchParams } = useChageSearchParams();
    const { pushInStack } = useSearchHistoryStack<SearchHistoryStackType>();

    const updateQuery = (data: { query: string }) => {
        const { query } = data;

        if (query.trim()) {
            addToSearchParams({ q: query.trim() });
            const filter = searchParams.get("f") || "";
            pushInStack({
                id: `${query}:${filter || "noFilter"}`,
                member: { query, filter },
            })
        }
        else removeFromSearchParams(["q"]);
    }

    const updateFilter = (value: string) => {
        if (value.trim() && value !== "all")
            addToSearchParams({ f: value.trim() });
        else removeFromSearchParams(["f"]);
    }

    return (
        <header className="fullScreen bg-primary border-b border-gray20 sticky top-0 z-2 pt-2 px-2">
            <section className="flex items-center">
                <Navigate comp="button" goto="back" className="smallBtn">
                    <LeftChevron />
                </Navigate>
                <Form
                    skipReset
                    submit={updateQuery}
                    className="h-10 md:h-12 w-full flex items-center gap-2 pl-2">

                    <SearchIcon className="size-4 ghostColor" />

                    <Input
                        type="search"
                        name="query"
                        defaultValue={searchParams.get("q") || undefined}
                        autoFocus
                        minLength={1}
                        className="h-full w-full border-0 p-0"
                        containerClasses="w-full h-full"
                        placeholder="What are you looking for?"
                    />
                </Form>
            </section>
            <ul className="mt-2 flex gap-4 noScroll overflow-x-auto bounceEffect overscroll-x-contain">
                {searchFilters.map(el => (
                    <li>
                        <Button
                            key={el}
                            id={`${el}-filter-button`}
                            title={el}
                            className={`relative border-0 border-b-2 capitalize px-2 py-2 ${filter === el ? "border-secondary" : "border-transparent"}`}
                            onClick={() => updateFilter(el)}
                        >
                            {el}
                        </Button>
                    </li>
                ))}
            </ul>
        </header>
    )
}

export default SearchHeader;