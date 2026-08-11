"use client";

import { AlertIcon, AtIcon, CommentIcon, ShelfIcon, PostIcon } from "@assets/Icons";
import { GenericWrapper, ObserverHeader } from "@components";
import { ProfileNavbar } from "@components/TopNavbar";
import { InteractiveDetailSection, LinksSection, OptionalChildren, ParloImage, TabContainer, TabList } from "@components/ui";
import { UserPageSkeleton } from "@components/ui/loading";
import { getUserByUsername } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys, numberConverter } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { RequestedUser } from "@type/internal";
import { PropsWithChildren } from "react";
import { toast } from "sonner";
import { ActionButton, MessageButton } from "./";

type Props = { username: string, uid: string | undefined };

const getQueryProps = ({ username }: Props) => ({
    queryKeys: getQueryKeys("user_username", { username }),
    queryFn: getUserByUsername,
    args: [username],
});

const HeaderWrapper = ({ uid, username, children }: PropsWithChildren<{ uid: string, username: string }>) => {
    const { meta } = useCurrentUser();

    if (!meta || meta.user_id !== uid) return (
        <ObserverHeader
            titleToShare={`Check out @${username} on Parlocula`}
            className="mt-4 px-2 sm:px-4"
            navTitle={username}
        >
            {children}
        </ObserverHeader>
    )

    return (
        <>
            <ProfileNavbar username={username} />
            <header className="mt-2 px-2">
                {children}
            </header>
        </>
    )

}

const Component = (data: RequestedUser, props: Props) => {

    const { _id, followers, following, posts, bio, name, username, profile, bioLinks, comments, publicShelves } = data;

    const userMeta = [
        { label: "followers", value: followers },
        { label: "following", value: following },
        { label: "posts", value: posts },
    ];

    const handleCopyUsername = () => {
        if ("clipboard" in navigator)
            navigator.clipboard.writeText(data.username)
                .then(() => toast.success("Username copied to clipboard"))
                .catch(() => { });
    }

    return (
        <>
            <HeaderWrapper uid={data._id} username={data.username}>

                <section className="flex gap-4 items-center">
                    <ParloImage
                        prioritize
                        fancyGallery="profile_picture"
                        frameType="userProfile"
                        alt={`Profile picture of the User - ${username}`}
                        size={112}
                        className="size-20 object-cover sm:size-28 max-h-fit aspect-square"
                        containerClassName="rounded-full"
                        classNameForFallback="p-2 sm:p-4 size-12 max-w-12 object-cover sm:size-20 sm:max-w-20"
                        frame={profile}
                        sizes={[
                            { maxScreenWidth: 480, imageWidth: 80 },
                            { imageWidth: 112 },
                        ]}
                    />
                    <div>
                        <OptionalChildren condition={name}>
                            <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold capitalize">{name}</h2>
                        </OptionalChildren>
                        <h1 onClick={handleCopyUsername} data-observe className="text-sm mt-1">
                            <AtIcon className="inline size-4 mr-1" />
                            <span>{username}</span>
                        </h1>
                    </div>
                </section>
                <section className="mt-4">
                    <ul className="flex gap-3 overflow-x-auto">
                        {userMeta.map(({ label, value }) => (
                            <li className="gap-1 flex items-center text-nowrap" key={label}>
                                <span className="text-base">{numberConverter(value)}</span>
                                <span className="text-sm ghostColor">{label}</span>
                            </li>
                        ))}
                    </ul>

                    <OptionalChildren condition={bio}>
                        <InteractiveDetailSection className="text-sm my-2">{bio}</InteractiveDetailSection>
                    </OptionalChildren>

                    <OptionalChildren condition={bioLinks.length}>
                        <LinksSection links={bioLinks} />
                    </OptionalChildren>

                </section>
                <section className="mt-4 flex gap-2">
                    <ActionButton username={username} uid={props.uid} rid={_id} />
                    <MessageButton profile={profile} username={username} ruid={_id} />
                </section>
            </HeaderWrapper>


            <TabContainer className="my-3">
                <TabList className="flex gap-2 flex-cntr-all" href={`/u/${username}`}>
                    <PostIcon className="min-w-5" />
                    <span>Posts</span>
                </TabList>
                <TabList className="flex gap-2 flex-cntr-all" href={`/u/${username}/comments`}>
                    <CommentIcon className="min-w-5" />
                    <span>Comments</span>
                </TabList>
                <TabList className="flex gap-2 flex-cntr-all" href={`/u/${username}/shelves`}>
                    <ShelfIcon className="min-w-5" />
                    <span>Shelves</span>
                </TabList>
                <OptionalChildren condition={props.uid}>
                    <TabList className="flex gap-2 flex-cntr-all" href={`/u/${props.username}/reports`}>
                        <AlertIcon className="min-w-5" />
                        <span>Reports</span>
                    </TabList>
                </OptionalChildren>
            </TabContainer>
        </>
    )
}

const Header = (props: Props) => {

    return (
        <GenericWrapper
            loadingComponent={<UserPageSkeleton heading={props.username} />}
            component={Component}
            getQueryProps={getQueryProps}
            props={props}
        />
    )
}

export default Header;