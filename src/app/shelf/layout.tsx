import { Sidebar } from "@components";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { PropsWithChildren } from "react";

export const metadata = generateDynamicMetadata({
    title: "Shelf",
    description: "Explore the collection of curated movies and shows collected by the die hard fans on Parlocula.",
    allowRobots: true
});

const ShelfLayout = async ({ children }: PropsWithChildren) => {

    return (
        <>
            <Sidebar />
            <main>
                {children}
            </main>
        </>
    )

}

export default ShelfLayout;