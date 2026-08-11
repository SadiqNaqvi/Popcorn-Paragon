import { UserWithoutCircleIcon } from "@assets/Icons";
import { Navbar, Navigate, Sidebar } from "@components";
import UserPageMockup from "@components/ui/mockup/UserPage";
import { getUserFromToken } from "@lib/backend/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const GuestProfilePage = async () => {

    const user = await getUserFromToken(await cookies());

    if (user) redirect(`/u/${user.username}`);

    return (
        <>
            <Sidebar />
            <main>
                <Navbar className="bg-primary" navTitle="Guest Profile" />
                <header className="px-2">
                    <section className="flex gap-4 mb-4 items-center">
                        <div className="size-24 md:size-28 md:min-w-28 m-0 p-6 md:p-8 rounded-full border-2 border-gray-500">
                            <UserWithoutCircleIcon className="size-full" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl">Guest</h2>
                            <p className="font-semibold">@guest</p>
                        </div>
                    </section>

                    <section className="flex gap-3">
                        <div className="space-x-[6px]">
                            <span className="font-semibold text-center text-lg">X</span>
                            <span className="">Posts</span>
                        </div>
                        <div className="space-x-[6px]">
                            <span className="font-semibold text-center text-lg">X</span>
                            <span className="">Followers</span>
                        </div>
                        <div className="space-x-[6px]">
                            <span className="font-semibold text-center text-lg">X</span>
                            <span className="">Following</span>
                        </div>
                    </section>

                    <section className="mt-4">
                        <p>Log-in to customize your profile as you want.</p>
                    </section>

                    <section className="mt-6 flex gap-2">
                        <Navigate goto="/join" comp="link" className="flex-1 btn primary">Log-in</Navigate>
                        <Navigate goto="/explore" comp="link" className="flex-1 btn secondary">Explore</Navigate>
                    </section>
                </header>
                <UserPageMockup />
            </main>
        </>
    )

}

export default GuestProfilePage;