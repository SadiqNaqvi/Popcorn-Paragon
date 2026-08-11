"use client";

import { BottomSheet, Navbar } from "@components";
import { Form, Input } from "@components/form";
import { Button } from "@components/ui";
import { FullPageLoadingSpinner } from "@components/ui/loading/LoadingSpinner";
import { deactivateAccount } from "@lib/frontend/helpers/mutations";
import useCurrentUser from "@store/user";
import { useRouter } from "next/navigation";
import { z } from "zod";

const schema = z.object({
    passkey: z.string().min(30).max(36),
});

const DeactivateAccountPage = () => {

    const { user, isHydrated } = useCurrentUser();
    const navigation = useRouter();

    if (!isHydrated) return <FullPageLoadingSpinner path={["Deactivate"]} />
    else if (!user) return null;

    const handleDeactivation = async ({ passkey }: { passkey: string }) => {
        const { success, error } = await deactivateAccount(user._id, passkey);
        if (!success) return error;
        navigation.replace('/join');
    }

    return (
        <>
            <Navbar />
            <header>
                <h1 className="text-xl text-center font-semibold">Account Deactivation</h1>
                <div className="space-y-2 mt-4">
                    <p>
                        If you want to take a break from Parlocula, you can temporarily deactivate your account.
                    </p>
                    <p>
                        Your profile will be hidden in that period of time until you reactivate by logging into your account.
                    </p>
                </div>
            </header>
            <section className="mt-6">
                <h2 className="font-semibold">Things you may lose meanwhile!</h2>
                <ul className="space-y-3 list-decimal">
                    <li>
                        <h3 className="font-semibold text-sm uppercase">New Followers</h3>
                        <p className="ghostColor mt-2">
                            Others would not be able to find your profile, even in search.
                        </p>
                    </li>
                    <li>
                        <h3 className="font-semibold text-sm uppercase">New Reactions, Likes and Saves</h3>
                        <p className="ghostColor mt-2">
                            Others may not be able to find your posts, comments, shelves, or anything related to your profile.
                        </p>
                    </li>
                    <li>
                        <h3 className="font-semibold text-sm uppercase">Updates on Parlocula</h3>
                        <p className="ghostColor mt-2">
                            Deactivating your account would stop us from updating you about People you follow, Threads you are a member of, Posts of your followed People and Threads, Comments on your posts, Replies on your Comments and much.
                        </p>
                    </li>
                </ul>
            </section>
            <footer className="mt-6">
                <p>Do you still want to deactivate your account?</p>

                <BottomSheet
                    className="primary w-full mt-4 sm:mx-auto sm:w-fit"
                    button="Yes, Deactivate My Account"
                    buttonTitle="Deactivate"
                >
                    <div className="my-4">
                        <Form submit={handleDeactivation} schema={schema}>
                            <Input
                                name="passkey"
                                label="Passkey"
                                placeholder="Please enter your passkey for security purpose"
                            />
                            <Button
                                id="deactivate-button"
                                title="Deactivate Account"
                                className="primary w-full mt-4 sm:mx-auto sm:w-fit"
                                type="submit"
                            >
                                Deactivate
                            </Button>
                        </Form>
                    </div>
                </BottomSheet>
            </footer>
        </>
    )

}

export default DeactivateAccountPage;