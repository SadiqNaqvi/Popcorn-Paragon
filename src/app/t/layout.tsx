import generateDynamicMetadata from "@lib/shared/seo/metadata";

export const metadata = generateDynamicMetadata({ title: "Threads" });

const ThreadHomeLayout = ({ children }: Readonly<{ children: React.ReactNode, }>) => {

    return (
        <main>{children}</main>
    )
}

export default ThreadHomeLayout;