"use client";

import { AlertIcon, AppIcon, AtIcon, BellIcon, BlockOrBanIcon, BookIcon, CommentIcon, EditIcon, EmailIcon, FeedbackIcon, FilterIcon, GroupIcon, HeartIcon, LeaveIcon, PostIcon, RainbowIcon, RightChevron, ShelfIcon, ShieldIcon, UserIcon, WifiIcon } from "@assets/Icons";
import { BottomSheet, Navbar, Navigate } from "@components";
import { WarningSheet } from "@components/sheets";
import { ParloFooter } from "@components/ui";
import InstallPrompt from "@components/ui/InstallPrompt";
import { FullPageLoadingSpinner } from "@components/ui/loading/LoadingSpinner";
import { logoutUser } from "@lib/frontend/helpers/mutations";
import useCurrentUser from "@store/user";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

const SectionList = ({ children, href, className = '' }: PropsWithChildren<{ href?: string, className?: string }>) => {

    if (href) return (
        <li className="px-2 py-3">
            <Navigate comp="link" goto={href} className="w-full flex flex-cntr-between">
                <div className={twMerge("flex gap-2 items-center", className)}>
                    {children}
                </div>
                <RightChevron className="size-4" />
            </Navigate>
        </li>
    )

    return (
        <li className={twMerge("px-2 py-3", className)}>
            {children}
        </li>
    )
}

const Sections = ({ heading, children }: PropsWithChildren<{ heading: string }>) => (
    <section className="space-y-3 mb-4 px-2 last:mb-0">
        <h2 className="parloHeading pl-2 mt-6">{heading}</h2>
        <ul className="border rounded-lg border-gray30">{children}</ul>
    </section>
)

const SettingPage = () => {

    const { user, isHydrated } = useCurrentUser();
    const navigation = useRouter();

    if (!isHydrated) return <FullPageLoadingSpinner path={["Settings"]} />
    else if (!user) return null;

    const handleLogout = () => {
        logoutUser().then(() => {
            navigation.replace('/join');
        });
    }

    return (
        <>
            <Navbar navTitle="Settings" />

            <InstallPrompt />

            <Sections heading="my account">

                <SectionList href="/settings/edit">
                    <EditIcon />
                    <span>Edit Profile</span>
                </SectionList>

                <SectionList href="/settings/edit/username">
                    <AtIcon />
                    <span>{user.username}</span>
                </SectionList>

                <SectionList href="/settings/edit/email">
                    <EmailIcon />
                    <p className="line-clamp-1">{user.email}</p>
                </SectionList>

                <SectionList href="/settings/account_status">
                    <UserIcon />
                    Account Status
                </SectionList>
            </Sections>

            <Sections heading="saved">
                <SectionList href="/settings/saved">
                    <PostIcon />
                    <span>Saved Posts</span>
                </SectionList>
                <SectionList href="/settings/saved/comments">
                    <CommentIcon />
                    <span>Saved Comments</span>
                </SectionList>
                <SectionList href="/settings/saved/shelves">
                    <ShelfIcon />
                    <span>Saved Shelves</span>
                </SectionList>
            </Sections>

            <Sections heading="people">
                <SectionList href="/settings/followers">
                    <GroupIcon />
                    <span>Followers</span>
                </SectionList>
                <SectionList href="/settings/following">
                    <HeartIcon />
                    <span>Following</span>
                </SectionList>
                <SectionList href="/settings/blocked">
                    <BlockOrBanIcon />
                    <span>Blocked</span>
                </SectionList>
            </Sections>

            <Sections heading="personalize">
                <SectionList href="/settings/notification">
                    <BellIcon />
                    <span>Notifications</span>
                </SectionList>
                <SectionList href="/settings/filter_content">
                    <FilterIcon />
                    <span>Filter Content</span>
                </SectionList>
                <SectionList href="/settings/data_saver">
                    <WifiIcon />
                    <span>Data Saver</span>
                </SectionList>
                <SectionList href="/settings/theme">
                    <RainbowIcon />
                    <span>App Theme</span>
                </SectionList>
            </Sections>

            <Sections heading="related to app">
                <SectionList href="/settings/report">
                    <AlertIcon />
                    <span>Report a Problem</span>
                </SectionList>
                <SectionList href="/settings/feedback">
                    <FeedbackIcon />
                    <span>Submit a Feedback, Request or Suggestion</span>
                </SectionList>
                <SectionList href="/app/terms_and_conditions">
                    <BookIcon />
                    <span>Terms and Conditions</span>
                </SectionList>
                <SectionList href="/app/privacy_policy">
                    <ShieldIcon />
                    <span>Privacy Policy</span>
                </SectionList>
                <SectionList href="/app/about">
                    <AppIcon className="size-4" />
                    <span>About Parlocula</span>
                </SectionList>
            </Sections>

            <Sections heading="actions for your account">
                <SectionList>
                    <BottomSheet 
                    className="flex items-center gap-2 w-full" 
                    buttonTitle="Log out"
                    button={(
                        <>
                            <LeaveIcon />
                            <span>Log out</span>
                        </>
                    )}>
                        <WarningSheet
                            action="logout"
                            dangerButton="Logout"
                            dangerFunc={handleLogout}
                        />
                    </BottomSheet>
                </SectionList>
                <SectionList href="/settings/deactivate_account" className="text-red-500">Deactivate Account</SectionList>
                <SectionList href="/settings/delete_account" className="text-red-500">Delete Account</SectionList>
            </Sections>
            <ParloFooter />
        </>
    )
}

export default SettingPage;