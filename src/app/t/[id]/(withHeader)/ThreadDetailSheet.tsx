import { RightChevron } from "@assets/Icons";
import { Navigate } from "@components";
import { LinksSection, OptionalChildren } from "@components/ui";
import { numberConverter, timeAgo } from "@lib/shared/utils";
import { Thread } from "@type/internal";
import { PropsWithChildren } from "react";

type Props = Pick<Thread, "connections" | "createdAt" | "description" | "creator" | "edited_by" | "links" | "managers" | "post_count" | "member_count" | "_id">

const Section = ({ children, condition, heading, fallback }: PropsWithChildren<{ condition?: any, heading: string, fallback?: React.ReactNode }>) => (
    <OptionalChildren condition={condition ?? true} fallback={fallback}>
        <section className="mx-2 my-6 space-y-2 px-2">
            <h3 className="parloHeading">{heading}</h3>
            {children}
        </section>
    </OptionalChildren>
)

const ThreadDetailSheet = ({ connections, createdAt, creator, description, edited_by, links, managers, member_count, post_count, _id }: Props) => {

    return (
        <div className="pb-4">
            <div className="py-2 border-b border-gray30">
                <h2 className="parloHeading text-center">More about this thread</h2>
            </div>

            <Section heading="Description">
                <p className="whitespace-break-spaces">{description}</p>
            </Section>

            <Section heading="Created At">
                <p>{new Date(createdAt).toLocaleDateString()} - {timeAgo(createdAt)}</p>
            </Section>

            <Section heading="Assets">
                <p className="my-2">Total Posts: {numberConverter(post_count)}</p>
                <div className="my-2 border border-gray20 rounded-md">
                    <Navigate comp="link" goto={`${_id}/members`} className="p-2 flex flex-cntr-between gap-2">
                        <span className="line-clamp-1">Members: {numberConverter(member_count)}</span>
                        <span><RightChevron /></span>
                    </Navigate>
                </div>
            </Section>

            <Section heading="Creator" condition={creator}>
                <div className="border border-gray20 rounded-md">
                    <Navigate comp="link" goto={`/u/${creator}`} className="p-2 flex flex-cntr-between gap-2">
                        <span className="line-clamp-1">{creator}</span>
                        <span><RightChevron /></span>
                    </Navigate>
                </div>
            </Section>

            <Section heading="Managers" condition={managers.length}>
                <ul className="space-y-2">
                    {managers.map(({ _id, username }) => (
                        <li key={_id} className="border border-gray20 rounded-md">
                            <Navigate className="p-2 flex gap-2 flex-cntr-between" comp="link" goto={`/u/${username}`}>
                                <span className="line-clamp-1">{username}</span>
                                <span><RightChevron /></span>
                            </Navigate>
                        </li>
                    ))}
                </ul>
            </Section>


            <Section heading="Last Edited By" condition={Boolean(edited_by)}>
                <div className="border border-gray20 rounded-md">
                    <Navigate comp="link" goto={`/u/${edited_by}`} className="p-2 flex flex-cntr-between gap-2">
                        <span className="line-clamp-1">{edited_by}</span>
                        <span><RightChevron /></span>
                    </Navigate>
                </div>
            </Section>

            <Section heading="Connections" condition={connections.length} fallback={(
                <div className="py-4">
                    <p>Not connected to any taleon or artist</p>
                </div>
            )}>
                <ul className="space-y-2">
                    {connections.map(({ name, extid, type }) => (
                        <li key={extid} className="border border-gray20 rounded-md">
                            <Navigate className="p-2 flex gap-2 flex-cntr-between" comp="link" goto={`/explore/${type === "person" ? "artist" : type}/${extid}`}>
                                <span className="line-clamp-1">{name}</span>
                                <span><RightChevron /></span>
                            </Navigate>
                        </li>
                    ))}
                </ul>
            </Section>

            <Section heading="External Links" condition={links.length}>
                <LinksSection links={links} />
            </Section>

        </div>
    )

}

export default ThreadDetailSheet;