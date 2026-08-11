"use client";

import { Ellipsis } from "@assets/Icons";
import { OptionMenu } from "@components";
import { ReportSheet, WarningSheet } from "@components/sheets";
import OptionList, { NestedSheetTrigger } from "@components/ui/OptionList";
import { blockUserMutation, deletePostMutation } from "@lib/frontend/helpers/mutations";
import useCurrentUser from "@store/user";
import { FullPost } from "@type/internal";
import { useRouter } from "next/navigation";

type Props = {
    post: FullPost,
}

const OptionsButton = ({ post }: Props) => {

    const { meta } = useCurrentUser();
    const navigation = useRouter();

    if (!meta) return null;

    const handleDelete = () => {
        deletePostMutation(meta.user_id, post._id, post);
        navigation.back();
    }

    const handleBlock = () => {
        blockUserMutation(meta.user_id, post.user_id);
        navigation.back();
    }

    if (meta.user_id === post.user_id) return (
        <OptionMenu
            buttonTitle="View Options"
            ButtonElement={<Ellipsis />}
        >
            <OptionList link={`${post._id}/edit`}>Edit</OptionList>
            <NestedSheetTrigger button="Delete">
                <WarningSheet
                    action="delete this post"
                    dangerButton="Delete"
                    dangerFunc={handleDelete}
                />
            </NestedSheetTrigger>
        </OptionMenu>
    )

    else return (
        <>
            <OptionMenu
                buttonTitle="View Options"
                ButtonElement={<Ellipsis />}
            >
                <NestedSheetTrigger button="Report">
                    <ReportSheet uid={meta.user_id} ext_id={post.thread_id} id={post._id} type="post" />
                </NestedSheetTrigger>
                <NestedSheetTrigger button="Block User">
                    <WarningSheet
                        action="block the author of this post"
                        dangerButton="Block"
                        dangerFunc={handleBlock}
                    />
                </NestedSheetTrigger>
            </OptionMenu>
        </>
    )

}

export default OptionsButton;