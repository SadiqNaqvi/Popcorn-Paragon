"use client";

import { Navbar } from "@components";
import { Dropdown, Form, Textarea } from "@components/form";
import { Button } from "@components/ui";
import { FullPageLoadingSpinner } from "@components/ui/loading/LoadingSpinner";
import { pagesEnumForBugOrSuggestion } from "@lib/shared/constants";
import { reportBugOrSuggestion } from '@lib/backend/actions/email';
import { reportOrSuggestionSchemaClient } from "@lib/shared/validation/schemas";
import useCurrentUser from "@store/user";
import { AppBugOrSuggestionSchemaClient } from '@type/schemas';
import { toast } from "sonner";

const AppFeedbackPage = () => {

    const { user, isHydrated } = useCurrentUser();

    if (!isHydrated) return <FullPageLoadingSpinner path={["Feedback or Suggestion"]} />
    else if (!user) return null;

    const handleSubmit = async (data: AppBugOrSuggestionSchemaClient) => {
        const { success, errors } = await reportBugOrSuggestion({
            ...data,
            user: {
                username: user.username,
                email: user.email,
                id: user._id
            },
            type: "suggestion"
        });

        if (!success && errors) {
            errors.map(e => {
                console.error(e);
                toast.error(typeof e === "string" ? e : e.message);
            });
        } else {
            toast.success("Feedback/Suggestion stored successfully. Thank you again.");
        }
    }

    return (
        <>
            <Navbar navTitle="Feedback or Suggestion" />
            <section className="my-4 space-y-1">
                <h1 className="text-lg text-center">Help us make Parlocula better.</h1>
                <p className="text-center text-sm">This is a home for all of us and it is our responsibility to keep it safe and make it better.</p>
            </section>
            <Form className="space-y-3 mt-4 px-2" submit={handleSubmit} schema={reportOrSuggestionSchemaClient}>
                <Dropdown
                    options={pagesEnumForBugOrSuggestion}
                    name="page"
                    label="Where can we make Parlocula even better?"
                />
                <Textarea
                    name="desc"
                    className="h-40 focus-within:outline-2 focus-within:outline-(--secondary)"
                    minLength={10}
                    maxLength={5000}
                    label="Description"
                    placeholder={
                        "What is your feedback on Parlocula? How exactly we can make Parlocula better? How you expect your suggested idea to work out? The more details the better!"
                    }
                />
                <Button
                    id="feedback-submit"
                    title="Submit"
                    type='submit'
                    className="primary w-full sm:w-fit"
                >
                    Submit
                </Button>
            </Form>
        </>
    )
}

export default AppFeedbackPage;