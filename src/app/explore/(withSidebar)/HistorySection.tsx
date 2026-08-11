"use client";

import { OptionalChildren, ParloImage, ParloImageFrameType } from "@components/ui";
import { useHistoryStack } from "@lib/frontend/hooks";
import { HistoryStackType } from "@type/other";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

const predictFrameType = (path: string): ParloImageFrameType => {
    if (path.includes("/t/")) return "groupPoster";
    else if (path.includes("/u/")) return "userProfile";
    else if (path.includes("/s/")) return "shelfPoster";
    return "poster";
}

const HistoryBar = ({ path, poster, title, image, type }: HistoryStackType) => (
    <article className="py-2 cursor-pointer">
        <div className="flex gap-2 items-center">
            <ParloImage
                frame={poster}
                frameType={predictFrameType(path)}
                classNameForFallback="min-w-8 size-8 p-1"
                className="size-12 min-w-12 object-cover"
                containerClassName="rounded-full overflow-hidden"
                alt={`Poster Picture of the ${type} - ${title}`}
            />
            <div>
                <OptionalChildren condition={title} fallback={(
                    <p className="text-sky-500 wrap-anywhere">{path}</p>
                )}>
                    <h4>{title}</h4>
                </OptionalChildren>
                <OptionalChildren condition={type}>
                    <p className="text-xs sm:text-sm ghostColor">{type}</p>
                </OptionalChildren>
            </div>
        </div>
        <OptionalChildren condition={image}>
            <ParloImage
                frame={image}
                frameType="poster"
                alt={`Large Image of the ${type} - ${title}`}
                className="max-w-60 w-full h-auto max-h-80 rounded-md object-cover"
                containerClassName="mt-2"
            />
        </OptionalChildren>
    </article>
)

const HistorySection = ({ className }: { className?: string }) => {

    const { historyStack, removeFromStack } = useHistoryStack();
    const router = useRouter();
    if (!historyStack || !historyStack.length) return null;

    const handleNavigation = (path: string) => {
        removeFromStack(path);
        router.push(path);
    }

    return (
        <div className={twMerge("space-y-2 px-2", className)}>
            <h3 className="parloHeading">Revisit your journey</h3>
            <ul>
                {historyStack.map(history => (
                    <li key={history.path} onClick={() => handleNavigation(history.path)}>
                        <HistoryBar {...history} />
                    </li>
                ))}
            </ul>
        </div>
    )

}

export default HistorySection;