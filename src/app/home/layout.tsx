import { Sidebar } from "@components";
import generateDynamicMetadata from "@lib/shared/seo/metadata";

export const metadata = generateDynamicMetadata({
    title: "Home",
});

export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <Sidebar />
            <main>
                {children}
            </main>
        </>
    )
}