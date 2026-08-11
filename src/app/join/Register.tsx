"use client";

import { Navigate } from "@components";
import { DateInput, Form, Input } from "@components/form";
import UserMutationPage from "@components/form/Mutation/UserMutation";
import Navbar from "@components/Navbar";
import { Button } from "@components/ui";
import { isUsernameAvailable } from "@lib/shared/helpers/internal_fetchers";
import { useCustomReducer } from "@lib/frontend/hooks";
import { usernameSchema } from "@lib/shared/validation/schemas";
import { codetoError } from "@lib/shared/utils";
import { useRef } from "react";
import z from "zod";

const Register = ({ email }: { email: string }) => {

    const { username, page, dob, setter } = useCustomReducer({ username: "", page: 0, dob: undefined as Date | undefined });
    const dobRef = useRef<{ get: () => Date | undefined }>(null);

    const storeDob = () => {
        const dob = dobRef.current?.get();
        if (dob) setter({ dob, page: 1 })
    }

    const checkUsernameAvailability = async (data: { username: string }) => {

        if (username && data.username.trim() === username)
            return setter({ page: 1 })

        const { errCode, result, success } = await isUsernameAvailable(data.username);

        if (!success) return codetoError(errCode);

        else if (!result) return [{ path: "username", message: "Username is not available" }]

        setter({ username: data.username, page: 2 });
    }

    if (page === 0) return (
        <>
            <Navbar className="p-0 h-fit! mt-4 sm:mt-0 bg-transparent" navTitle="Create Account" />

            <div className="space-y-2">
                <label htmlFor="Date" className="block">Date of birth</label>
                <DateInput dateRef={dobRef} onComplete={storeDob} />
            </div>

            <p className="text-center text-sm ghostColor mt-2">DOB will not appear on your profile.</p>

            <Button
                id="next-page-button-dob"
                title="Go Next"
                onClick={storeDob}
                className="primary w-full my-4"
            >
                Next
            </Button>

            <p className="mt-4">
                You are about to create a new account. By continuing, you accept the
                <Navigate className="mx-1 inline text-sky-500 underline" goto="/app/terms_and_conditions" comp="link">
                    Terms and Conditions
                </Navigate>
                to use Parlocula.
            </p>
        </>
    )

    else if (page === 1) return (
        <>
            <Navbar
                onGoBack={() => setter({ page: 0 })}
                className="p-0 h-fit! mt-4 sm:mt-0 bg-transparent"
                navTitle="Create Account" />

            <Form
                className="mt-6 mb-3"
                schema={z.object({ username: usernameSchema })}
                submit={checkUsernameAvailability}>

                <Input
                    data-testid="usernameInputBox"
                    defaultValue={username}
                    name="username"
                    description="Recommended: Use the name of your favourite character and sprinkle some numbers and an underscore in it."
                    placeholder="Username"
                    label="Choose a username"
                    autoFocus
                />

                <Button
                    id="username-submit-button"
                    title="Go Next"
                    type="submit"
                    className="primary w-full mt-4"
                >
                    Next
                </Button>

            </Form>

            <p className="text-center text-sm ghostColor mt-2">You can change them later.</p>
        </>
    )

    return (
        <div id="profilePreview" className="bg-primary max-w-3xl sm:mx-auto">
            <UserMutationPage isEditing={false} dob={dob} email={email} username={username} />
        </div>
    )

}

export default Register;