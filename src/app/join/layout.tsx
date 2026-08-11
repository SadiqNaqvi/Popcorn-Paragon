import { getUserFromToken } from "@lib/backend/utils";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
    title: "Join"
};

const AuthLayout = async ({ children }: PropsWithChildren) => {

    const user = await getUserFromToken(await cookies());
    if (user) redirect('/home');

    return (
        <main className="noPadding md:flex h-full fullScreen overflow-hidden">
            <section className="peer has-[#profilePreview]:px-2 px-4 md:pr-0 sm:mt-4 has-[#profilePreview]:mt-0 relative z-1 w-full md:[&:not(:has(#profilePreview))]:w-85 max-h-full noScroll overflow-y-auto">
                {children}
            </section>
            <section className="peer-has-[#profilePreview]:hidden md:m-4 md:relative flex-1 w-full md:w-auto md:border border-gray30 md:rounded-xl overflow-hidden">
                <div className="patternBackground"></div>
                <div className="relative z-0 size-full md:rounded-xl flex flex-cntr-all">
                    <div className="hidden md:inline">
                        <h1 className="text-4xl md:text-5xl uppercase text-center select-none">Parlocula</h1>
                        <p className="mt-2 text-center text-sm select-none">The Cinematic Planet</p>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default AuthLayout;