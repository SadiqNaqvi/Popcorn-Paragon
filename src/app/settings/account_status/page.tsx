import { Navbar } from "@components";
import { OptionalChildren, ParloImage } from "@components/ui";
import { getUserFromToken } from "@lib/backend/utils";
import { GenericDate } from "@type/internal";
import { cookies } from "next/headers";

const BannedSection = ({ banEndsAt }: { banEndsAt: GenericDate }) => (
    <>
        <h2 className="text-red-500 text-center">Your account is Temporary Banned</h2>
        <ul className="my-4 space-y-2">
            <li className="text-center">
                In this while, you can only view content on this app like a guest but cannot do anything.
            </li>
            <li className="text-center">
                This is your time to learn from your mistakes and try not to repeat them.
            </li>
            <li className="text-center">
                Further mistakes can lead to permanent banned. Please take care about this.
            </li>
        </ul>

        <p className="text-sm ghostColor">Your Banned will end on {new Date(banEndsAt).toDateString()}</p>
    </>
)

const ClearSection = () => (
    <>
        <h2 className="text-green-500 text-center">Your account is fine.</h2>
        <p className="text-center">Enjoy your time on Parlocula.</p>
    </>
)

const AccountStatusPage = async () => {

    const user = await getUserFromToken(await cookies());

    if (!user) return null;

    return (
        <>
            <Navbar navTitle="Account Status" />

            <section className="px-2 flex flex-col flex-cntr-all mt-6">
                <div className="space-y-2 mb-4">
                    <ParloImage
                        frame={user.profile}
                        frameType="userProfile"
                        alt="Your Profile Picture"
                        prioritize
                        height={48}
                        width={48}
                        className="size-20"
                        containerClassName="rounded-full mx-auto"
                        classNameForFallback="size-16 max-w-fit p-3"
                    />
                    <h1 className="font-semibold">@{user.username}</h1>
                </div>

                <OptionalChildren
                    condition={user.isBanned && user.banEndsAt}
                    fallback={<ClearSection />}
                >
                    <BannedSection banEndsAt={user.banEndsAt!} />
                </OptionalChildren>

            </section>
        </>

    );
}

export default AccountStatusPage;