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

const AppReportPage = () => {

    const { user, isHydrated } = useCurrentUser();

    if (!isHydrated) return <FullPageLoadingSpinner path={["Report a bug or issue"]} />
    else if (!user) return null;

    const handleSubmit = async (data: AppBugOrSuggestionSchemaClient) => {
        const { success, errors } = await reportBugOrSuggestion({
            ...data,
            user: {
                username: user.username,
                email: user.email,
                id: user._id
            },
            type: "report"
        });

        if (!success && errors) {
            errors.map(e => {
                console.error(e);
                toast.error(typeof e === "string" ? e : e.message);
            });
        }
    }

    return (
        <>
            <Navbar navTitle="Report a bug or issue" />
            <section className="my-4 space-y-2">
                <h1 className="text-lg text-center">Help us make Parlocula better.</h1>
                <p className="text-center">This is a home for all of us and it is our responsibility to keep it safe and make it better.</p>
            </section>
            <Form className="space-y-3 mt-4 px-2" submit={handleSubmit} schema={reportOrSuggestionSchemaClient}>
                <Dropdown
                    options={pagesEnumForBugOrSuggestion}
                    name="page"
                    label="Where are you having this issue/bug?"
                />
                <Textarea
                    name="desc"
                    className="h-40 focus-within:outline-2 focus-within:outline-(--secondary)"
                    minLength={10}
                    maxLength={5000}
                    label="Description"
                    placeholder={
                        "Where exactly you found this issue or bug? How did it happen? (Mention step by step if possible). The more details the better!"
                    }
                />
                <Button
                    id="report-submit"
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

export default AppReportPage;