import { makeUrlSafe, numberConverter } from "@lib/shared/utils"
import { MereThread } from "@type/internal"
import { Navigate } from "@components"
import { OptionalChildren, ParloImage } from "@components/ui"

const ThreadTile = ({ name, poster, _id, member_count, post_count }: MereThread) => {
    return (
        <Navigate
            historyPayload={{ title: name, poster, type: "thread" }}
            role="button"
            comp="link"
            goto={`/t/${_id}-${makeUrlSafe(name)}`}
        >
            <article className="flex gap-2 items-center p-2">
                <ParloImage
                    frameType="groupPoster"
                    className="min-w-12 size-12 object-cover"
                    containerClassName="rounded-full overflow-hidden"
                    classNameForFallback="min-w-8 size-8 p-1"
                    frame={poster}
                    alt={`Poster of thread - ${name}`}
                    size={48}
                />
                <section className="space-y-1">
                    <h3 className="font-semibold line-clamp-1">{name}</h3>
                    <div className="space-x-2 text-sm ghostColor">
                        <OptionalChildren condition={member_count}>
                            <span> {numberConverter(member_count)} Members</span>
                        </OptionalChildren>
                        <OptionalChildren condition={post_count}>
                            <span> {numberConverter(post_count)} Posts</span>
                        </OptionalChildren>
                    </div>
                </section>
            </article>
        </Navigate>
    )
}

export default ThreadTile;