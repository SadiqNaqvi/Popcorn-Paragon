import Navigate from "@components/Navigate";
import { makeUrlSafe } from "@lib/shared/utils";
import { MereThread } from "@type/internal";
import ParloImage from "./ParloImage/ParloImage";

const ThreadBox = ({ _id, name, poster }: MereThread) => (
    <article className="size-24" key={_id}>
        <Navigate
            historyPayload={{ title: name, poster, type: "thread" }}
            className="size-full p-2 flex flex-col flex-cntr-all gap-3"
            comp="link"
            role="button"
            goto={`/t/${_id}-${makeUrlSafe(name)}`}
        >
            <ParloImage
                frameType="profile"
                size={48}
                className="size-12 object-cover rounded-full"
                frame={poster}
                alt={`Poster of thread ${name}`}
            />
            <h4 className="line-clamp-1 text-lg">{name}</h4>
        </Navigate>
    </article>
)

export default ThreadBox;