import Navigate from "@components/Navigate";
import { MereUser } from "@type/internal";
import { MetadataTile, MetadataTileContainer, ParloImage } from "./";
import { numberConverter } from "@lib/shared/utils";

export const SimpleUserBar = ({ profile, username, followers, posts }: MereUser) => (
    <article className="flex items-center gap-2 py-2">
        <ParloImage
            frameType="userProfile"
            className="min-w-10 size-10 object-cover"
            classNameForFallback="size-8 min-w-8 overflow-hidden p-1"
            containerClassName="rounded-full"
            size={32}
            alt={`Profile picture of ${username}`}
            frame={profile}
        />
        <div>
            <h5 className="line-clamp-1">{username}</h5>
            <MetadataTileContainer>
                <MetadataTile className="text-xs" condition={!!followers}>{numberConverter(followers)} Followers</MetadataTile>
                <MetadataTile className="text-xs" condition={!!posts}>{numberConverter(posts)} Posts</MetadataTile>
            </MetadataTileContainer>
        </div>
    </article>
)

const UserBar = ({ profile, username, _id }: MereUser) => {
    return (
        <Navigate
            historyPayload={{ title: username, poster: profile, type: "user", }}
            comp="link"
            goto={`/u/${username}`}
        >
            <SimpleUserBar username={username} profile={profile} _id={_id} />
        </Navigate>
    )
}

export default UserBar;