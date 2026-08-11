"use client";

import OptionMenu from "@components/OptionMenu";
import { OptionList } from "@components/ui";
import { hideRoom, updateNotificationOfRoom } from "@lib/frontend/helpers/mutations";
import useGlobalStore from "@store/globalStore";
import useRoomStore from "@store/roomStore";
import useCurrentUser from "@store/user";

const RoomBarSheet = () => {

    const [selectedRoomId, setSelectedRoomId] = useGlobalStore("roombarSheet", undefined);
    const { room } = useRoomStore();
    const { meta } = useCurrentUser();

    const selectedRoom = selectedRoomId ? room[selectedRoomId] : undefined;

    if (!selectedRoom || !meta) return;

    const handleHide = () => {
        hideRoom(selectedRoom._id, meta.user_id);
    }

    const handleNotification = () => {
        updateNotificationOfRoom(selectedRoom.room_id, meta.user_id, !selectedRoom.mute);
    }

    return (
        <OptionMenu
            buttonTitle="View Options for room"
            state
            onClose={() => setSelectedRoomId(undefined)}
        >
            <OptionList onClick={handleHide}>Hide</OptionList>
            <OptionList onClick={handleNotification}>{selectedRoom.mute ? "Unmute" : "Mute"}</OptionList>
        </OptionMenu>
    )

}

export default RoomBarSheet;