"use client";

import { Navbar } from "@components";
import { Form, Input, OTPInput, Passkey } from "@components/form";
import { Button, LoadingSpinner } from "@components/ui";
import { sendVerificationCode } from "@lib/backend/actions/email";
import generateFingerprint from "@lib/frontend/auth/fingerprint";
import { updateEmail } from "@lib/frontend/helpers/mutations";
import { useCustomReducer } from "@lib/frontend/hooks";
import { codetoError, getTimeInFuture } from "@lib/shared/utils";
import { emailUpdateSchema } from "@lib/shared/validation/schemas";
import useCurrentUser from "@store/user";
import { useRef } from "react";
import { toast } from "sonner";

const Page = () => {
    const { user, isHydrated } = useCurrentUser();

    const { page, update, setter } = useCustomReducer({
        page: "update" as "update" | "verify",
        update: null as { email: string, passkey: string } | null
    });

    const otpRef = useRef<{ otp: string }>(null);

    if (!isHydrated) return <LoadingSpinner />
    else if (!user) return null;

    const { email, emailUpdatedAt } = user;
    const canUpdate = Boolean(emailUpdatedAt && Date.now() > getTimeInFuture({ unit: "mo", from: emailUpdatedAt }))

    if (emailUpdatedAt && !canUpdate) return (
        <>
            <Navbar navTitle="Edit Email" />

            <p className="mt-4 text-center px-2">
                You cannot update your email for now as it can only be updated once in a month. Please try again after a month.
            </p>
        </>
    )

    const submitEmailAndSendCode = async (data: { email: string, passkey: string }) => {

        const { success, errCode } = await sendVerificationCode(data.email, await generateFingerprint());
        if (!success) return codetoError(errCode);

        toast.success("Verification Code sent successfully");
        setter({ page: "verify", update: data });
    }

    const requestUpdate = async (value?: string) => {
        if (!update || update.email === email) return;
        const code = Number(value || otpRef.current?.otp);

        if (!code) return toast("Please enter the 6 digit sent to your email");

        const { success, error } = await updateEmail({ code, ...update })
        if (!success) return error;
    }

    if (page === "verify") return (
        <>
            <Navbar navTitle="Edit Email" />
            <section className="space-y-4 px-2">
                <OTPInput onSubmit={requestUpdate} getterRef={otpRef} />

                <Button
                    id="submit-button"
                    title="Verify"
                    className="primary w-full md:w-fit"
                >
                    Verify
                </Button>

                <p>Please check spam or all email if you can{"'"}t find our email. If you still think you didn{"'"}t recieve an email from us, Please check your email or try again after an hour.</p>
            </section>
        </>
    )

    return (
        <>
            <Navbar navTitle="Edit Email" />
            <Form
                className="space-y-4 px-2"
                defaultVals={{ email }}
                submit={submitEmailAndSendCode}
                schema={emailUpdateSchema}
            >
                <Input name="email" placeholder="Email" />

                <Passkey name="passkey" placeholder="Passkey" />

                <Button
                    id="verify-email-button"
                    title="Verify Email"
                    type="submit"
                    className="primary w-full md:w-fit"
                >
                    Verify Email
                </Button>

                <div className="space-y-2">
                    <p>Email can be updated only once in a month.</p>
                    <p>Your email help us identify you and help us keep you inform with importannt information through email. Make sure not to change your email unless it is necessary.</p>
                </div>

            </Form>
        </>
    )
}

export default Page;