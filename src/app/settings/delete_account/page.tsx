"use client"

import { Navbar, Navigate } from "@components";
import { BlogHeading1, BlogHeading2, BlogSection, BlogSubSection } from "@components/blog";
import { FullPageLoadingSpinner } from "@components/ui/loading/LoadingSpinner";
import { deleteAccount } from "@lib/frontend/helpers/mutations";
import { numberConverter } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { useRef, useState } from "react";
import FinalSection from "./FinalSection";
import ProcedureSection from "./ProcedureSection";
import ReasonSection from "./ReasonSection";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui";

const ThingsToLooseList = ({ count, description, heading, }: { heading: string, count: number | null, description: string }) => {
    if (count !== null && count < 1) return;

    return (
        <li className="my-4 space-y-2">
            <h4 className="font-semibold">{heading}</h4>
            <p className="text-sm ghostColor">{description}</p>
        </li>
    )
}

const DeleteAccountPage = () => {

    const { user, isHydrated } = useCurrentUser();
    const navigation = useRouter();
    const [section, setSection] = useState<"intro" | "reason" | "procedure" | "final">("intro");
    const reasonRef = useRef("");

    if (!isHydrated) return <FullPageLoadingSpinner path={["Delete Account"]} />
    else if (!user) return null;

    const storeReason = (reason: string) => {
        reasonRef.current = reason;
        setSection("procedure");
    }

    const handleDelete = async (passkey: string) => {
        const reason = reasonRef.current || "";
        const errors = await deleteAccount(user._id, reason, passkey);
        if (errors) return errors;
        navigation.replace('/join');
    }

    if (section === "reason") return (
        <>
            <Navbar />
            <ReasonSection callback={storeReason} />
        </>
    )

    else if (section === "procedure") return (
        <>
            <Navbar />
            <ProcedureSection />
            <footer className="px-2 py-4">
                <Button
                    id="continue-button"
                    title="Continue"
                    onClick={() => setSection("final")}
                    className="primary w-full sm:w-fit sm:mx-auto">
                    Continue
                </Button>
            </footer>
        </>
    )

    else if (section === "final") return (
        <>
            <Navbar />
            <FinalSection uid={user._id} callback={handleDelete} />
        </>
    )

    return (
        <>
            <Navbar />

            <header>
                <BlogHeading1>Delete Account</BlogHeading1>
                <BlogSubSection>
                    <p>
                        This is where you can request Parlocula to parmanently delete your account. <strong>Account deletion is permanent and cannot be reverted back.</strong>
                    </p>
                </BlogSubSection>
            </header>

            <BlogSection>
                <BlogHeading2>Before You Delete Your Account</BlogHeading2>
                <BlogSubSection>
                    <p>
                        Once you submit this request, your account will be scheduled for deletion and after the waiting period, everything connected to your profile will be <strong>erased forever</strong>.
                    </p>
                    <p>
                        If you simply want a break from Parlocula, it is much safter to
                        <Navigate comp="link" className="text-sky-500 underline" goto="/settings/deactivate_account">deactivate your account.</Navigate>
                    </p>
                </BlogSubSection>
            </BlogSection>

            <BlogSection>
                <BlogHeading2>Things you would loose by deleting your account.</BlogHeading2>
                <ul>
                    <ThingsToLooseList
                        heading={`${numberConverter(user.followers || 0)} Followers`}
                        description="Yes! Everyone who loved you, followed you and supported you will be gone."
                        count={user.followers || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.following || 0)} People you follow`}
                        description="Everyone you once connected on Parlocula."
                        count={user.following || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.posts || 0)} Posts`}
                        description="Access to all the Posts you have created and shared on Parlocula."
                        count={user.posts || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.comments || 0)} Comments`}
                        description="Access to all the discussions, theories, support, love and many other things you have created in the comment section."
                        count={user.comments || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.publicShelves || 0 + 3)} Shelves`}
                        description="All the shelves you have once created and shared with your friends. All the memories those shelves hold."
                        count={user.publicShelves || 0 + 3}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.createdThreads || 0)} Created Threads`}
                        description="The ownership of all the threads created by you."
                        count={user.createdThreads || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.joinedThreads || 0)} Joined Threads`}
                        description="The membership of all the threads joined by you."
                        count={user.joinedThreads || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.rooms || 0)} Chats`}
                        description="All the chats you once made on Parlocula. All of the texts, emojis and memories once shared."
                        count={user.rooms || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.savedContents || 0)} Saved Contents`}
                        description="All the contents (posts, comments and shelves) you have once saved on Parlocula."
                        count={user.savedContents || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.reactions || 0)} Reactions`}
                        description="All the reactions once made on your posts."
                        count={user.reactions || 0}
                    />
                    <ThingsToLooseList
                        heading={`${numberConverter(user.likes || 0)} Likes`}
                        description="All the likes your comments have once earned."
                        count={user.likes || 0}
                    />
                    <ThingsToLooseList
                        heading="Even your username!"
                        description="Your unique username, your identity may be available to others after deletion."
                        count={null}
                    />
                    <li className="mt-4">And many more.</li>
                </ul>
            </BlogSection>

            <footer className="space-y-3">
                <p className="text-sm">This action <strong>cannot be undone</strong>. Do not proceed unless you are sure.</p>
                <Button
                    id="first-page-continue"
                    title="Continue"
                    onClick={() => setSection("reason")}
                    className="primary w-full sm:w-fit sm:mx-auto"
                >
                    Continue
                </Button>
            </footer>
        </>
    )

}

export default DeleteAccountPage;