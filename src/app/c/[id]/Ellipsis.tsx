"use client";

import { Ellipsis } from "@assets/Icons";
import { OptionMenu } from "@components";
import { ReportSheet, WarningSheet } from "@components/sheets";
import { NestedSheetTrigger } from "@components/ui/OptionList";
import { blockUserMutation, deleteCommentMutation } from "@lib/frontend/helpers/mutations";
import useCurrentUser from "@store/user";
import { FullComment } from "@type/internal";
import { useRouter } from "next/navigation";
import EditComment from "./EditComment";

const OptionsButton = ({ author, id, comment }: { author: string, id: string, comment: FullComment }) => {

    const { meta } = useCurrentUser();
    const navigation = useRouter();

    if (!meta) return null;

    const handleDelete = () => {
        deleteCommentMutation(id, meta.user_id, comment.post_id, comment.replied_to);
        navigation.back();
    }

    const handleBlock = () => {
        blockUserMutation(meta.user_id, author);
        navigation.back();
    }


    if (meta.user_id === author) return (
        <OptionMenu
            buttonTitle="View Options"
            ButtonElement={<Ellipsis />}
        >
            <NestedSheetTrigger button="Edit">
                <EditComment comment={comment} />
            </NestedSheetTrigger>
            <NestedSheetTrigger button="Delete">
                <WarningSheet
                    action="delete this comment"
                    dangerButton="Delete"
                    dangerFunc={handleDelete}
                />
            </NestedSheetTrigger>
        </OptionMenu>
    )

    return (
        <OptionMenu
            buttonTitle="View Options"
            ButtonElement={<Ellipsis />}
        >
            <NestedSheetTrigger button="Report">
                <ReportSheet ext_id={comment.thread_id} uid={meta.user_id} id={id} type="comment" />
            </NestedSheetTrigger>
            <NestedSheetTrigger button="Block User">
                <WarningSheet
                    action="block the author of this comment"
                    dangerButton="Block"
                    dangerFunc={handleBlock}
                />
            </NestedSheetTrigger>
        </OptionMenu>
    )

}

export default OptionsButton;