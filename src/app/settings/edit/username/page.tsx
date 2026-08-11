"use client";

import { Navbar } from "@components";
import { Form, Input, Passkey } from "@components/form";
import { Button, LoadingSpinner } from "@components/ui";
import { updateUsername } from "@lib/frontend/helpers/mutations";
import { usernameUpdateSchema } from "@lib/shared/validation/schemas";
import { getTimeInFuture } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { useRouter } from "next/navigation";

const Page = () => {
    const { user, isHydrated } = useCurrentUser();
    const navigation = useRouter();

    if (!isHydrated) return <LoadingSpinner />
    else if (!user) return null;

    const { username, usernameUpdatedAt } = user;
    const canUpdate = !!(usernameUpdatedAt && Date.now() > getTimeInFuture({ unit: "mo", from: usernameUpdatedAt }));

    if (usernameUpdatedAt && !canUpdate) return (
        <>
            <Navbar navTitle="Edit Username" />
            <p className="mt-4 text-center px-2">
                You cannot update your username for now since you have already updated it within a month. Please try again after a month.
            </p>
        </>

    )

    const submit = async (data: { username: string, passkey: string }) => {
        if (data.username === username) return;
        const { success, error } = await updateUsername(data);
        if (!success) return error;
        navigation.push(`/u/${data.username.trim()}`);
    }

    return (
        <>
            <Navbar navTitle="Edit Username" />
            <Form
                className="space-y-4 px-2"
                defaultVals={{ username }}
                submit={submit}
                schema={usernameUpdateSchema}
            >
                <Input name="username" placeholder="Username" />

                <Passkey name="passkey" placeholder="Passkey" />

                <Button
                    id="submit-button"
                    title="Update"
                    type="submit"
                    className="primary w-full md:w-fit"
                >
                    Update
                </Button>

                <div className="space-y-2">
                    <p>Username can be updated only once in a month.</p>
                    <p>Username is your identity and changing it may lead to others unable to find you unless they know your new username. Be sure before updating it.</p>
                </div>
            </Form>
        </>
    )
}
export default Page;