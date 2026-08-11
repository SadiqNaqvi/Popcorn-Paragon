import { BottomSheet } from "@components";
import { BlogHeading3, BlogSubSection } from "@components/blog";
import { Form, Input } from "@components/form";
import { Button } from "@components/ui";
import { deactivateAccount } from "@lib/frontend/helpers/mutations";
import { getTimeInFuture } from "@lib/shared/utils";
import { useRouter } from "next/navigation";
import { z } from "zod";

const schema = z.object({
    passkey: z.string().min(30).max(36),
});

const FinalSection = ({ uid, callback }: { uid: string, callback: (passkey: string) => Promise<any> }) => {

    const navigation = useRouter();

    const handleDeletion = async ({ passkey }: { passkey: string }) => {
        return await callback(passkey);
    }

    const handleDeactivation = async ({ passkey }: { passkey: string }) => {
        const { success, error } = await deactivateAccount(uid, passkey);
        if (!success) return error;
        navigation.replace('/join');
    }

    return (
        <>
            <header>
                <BlogHeading3>Confirm Permanent Deletion</BlogHeading3>
                <BlogSubSection>
                    <p>
                        If you continue with account deletion, your profile along with everything mentioned in the previour sections will be deleted on
                        <strong>{new Date(getTimeInFuture({ unit: "d", timeVal: 30 })).toDateString()}.</strong>
                    </p>
                </BlogSubSection>
            </header>
            <section className="my-4">
                <BlogHeading3>Still not sure?</BlogHeading3>
                <p className="mt-2">It{"'"}s much safer to deactivate your account instead. All of your content + followers will be there waiting for you. Only your profile will become invisible, notifications will stop, and you can return whenever you feel ready.</p>
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
            </section>
            <footer className="px-2 py-4">
                <p className="mb-2">Do you still want to delete your account?</p>

                <BottomSheet
                    className="primary w-full mt-4 sm:mx-auto sm:w-fit"
                    button="Yes, Delete My Account"
                    buttonTitle="Delete"
                >
                    <div className="my-4">
                        <Form submit={handleDeletion} schema={schema}>

                            <Input
                                name="passkey"
                                label="Passkey"
                                placeholder="Please enter your passkey for security purpose"
                            />

                            <Button
                                id="delete-account-button"
                                title="Delete Account"
                                className="primary w-full mt-4 sm:mx-auto sm:w-fit"
                                type="submit"
                            >
                                Delete
                            </Button>
                        </Form>
                    </div>
                </BottomSheet>
            </footer>
        </>
    )
}

export default FinalSection;