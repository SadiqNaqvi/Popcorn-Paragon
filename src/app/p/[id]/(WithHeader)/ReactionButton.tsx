"use client";

import { ReactIcon } from "@assets/Icons";
import { BottomSheet, BottomSheetRef, UserBasedButton, UserBasedButtonProps } from "@components";
import { getReactionOnPost } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys, numberConverter } from "@lib/shared/utils";
import EmojiPicker, { Emoji, type EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { useRef } from "react";

const className = "flex gap-2 items-center text-sm py-2 px-3 rounded-full border border-gray30";

const NoUserStateButton = ({ count }: { count: number }) => (
    <>
        <ReactIcon />
        <span>{numberConverter(count)}</span>
    </>
)

const ReactionButton = ({ id, count, uid }: { id: string, count: number, uid: string | undefined }) => {

    const sheetRef = useRef<BottomSheetRef>(null);
    const { resolvedTheme } = useTheme();

    const Button = ({ onClick, state, user_id }: UserBasedButtonProps<string>) => {

        const handleReactionClick = (el: EmojiClickData) => {
            const { unified } = el;
            if (state === unified) onClick(null, "remove_reaction", [id, user_id]);
            else onClick(unified, "create_reaction", [user_id, id, unified]);
            sheetRef.current?.close();
        }

        return (
            <>
                <BottomSheet
                    button={
                        <>
                            <span>
                                {state ? <Emoji unified={state} size={18} /> : <ReactIcon />}
                            </span>
                            <span>
                                {numberConverter(count + (state ? 1 : 0))}
                            </span>
                        </>
                    }
                    className={className}
                    ref={sheetRef}
                    buttonTitle="React on this Post"
                >
                    <EmojiPicker
                        theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                        previewConfig={{ showPreview: false }}
                        className="mx-auto"
                        lazyLoadEmojis
                        onEmojiClick={handleReactionClick}
                        reactionsDefaultOpen
                        autoFocusSearch={false}
                        style={{ display: "flex" }}
                    />
                </BottomSheet>
            </>
        )
    }

    return (
        <UserBasedButton
            buttonTitle="React on this Post"
            uid={uid}
            noUserStateChilren={<NoUserStateButton count={count} />}
            noUserStateClassName={className}
            redirectAfterLogin={`/p/${id}`}
            ErrorComponent={<NoUserStateButton count={count} />}
            Button={Button}
            queryFn={(userid) => getReactionOnPost(id, userid)}
            queryKeys={getQueryKeys("reaction_pid", { pid: id })}
        />
    )
}

export default ReactionButton;