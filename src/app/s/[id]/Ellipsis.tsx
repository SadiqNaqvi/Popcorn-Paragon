import { Ellipsis } from "@assets/Icons";
import { OptionMenu } from "@components";
import { WarningSheet } from "@components/sheets";
import OptionList, { NestedSheetTrigger } from "@components/ui/OptionList";
import { blockUserMutation, deleteShelfMutation, updateShelfKeyMutation } from "@lib/frontend/helpers/mutations";
import useCurrentUser from "@store/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const EllipsisButton = ({ author, id, isPrivate }: { author: string, id: string, isPrivate: boolean }) => {

    const { meta } = useCurrentUser();
    const navigation = useRouter();

    if (!meta) return null;

    const handleDelete = () => {
        deleteShelfMutation(id, meta.user_id);
        navigation.back();
    }

    const handleBlock = () => {
        blockUserMutation(meta.user_id, author);
        navigation.back();
    }

    const handlePasskeyUpdate = () => {
        toast.promise(updateShelfKeyMutation(id, meta.user_id), {
            success: (result) => {
                if (!result) return "Successfully Updated";
            }
        })
    }


    if (meta.user_id === author) return (
        <OptionMenu
            buttonTitle="View Options"
            ButtonElement={<Ellipsis />}
        >

            <OptionList link={`${id}/edit`}>Edit</OptionList>

            <NestedSheetTrigger button="Delete">
                <WarningSheet
                    action="delete this shelf"
                    dangerButton="Delete"
                    dangerFunc={handleDelete}
                />
            </NestedSheetTrigger>

            {isPrivate && (
                <NestedSheetTrigger button="Update your Shelf Key">
                    <WarningSheet
                        action="update shelf-key"
                        details="Nobody can view your shelf with the old key anymore."
                        dangerButton="Update"
                        dangerFunc={handlePasskeyUpdate}
                    />
                </NestedSheetTrigger>
            )}

        </OptionMenu>
    )

    return (
        <OptionMenu
            buttonTitle="View Options"
            ButtonElement={<Ellipsis />}
        >
            <NestedSheetTrigger button="Block User">
                <WarningSheet
                    action="block the creator of this shelf"
                    dangerButton="Block"
                    dangerFunc={handleBlock}
                />
            </NestedSheetTrigger>
        </OptionMenu>
    )

}

export default EllipsisButton;