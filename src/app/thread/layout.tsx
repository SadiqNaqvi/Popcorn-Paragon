import { Sidebar } from "@components";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { PropsWithChildren } from "react";

export const metadata = generateDynamicMetadata({
    title: "Threads",
    allowRobots: true,
});

const ThreadHomeLayout = ({ children }: PropsWithChildren) => (
    <>
        <Sidebar />
        <main>
            {children}
        </main>
    </>
)

export default ThreadHomeLayout;