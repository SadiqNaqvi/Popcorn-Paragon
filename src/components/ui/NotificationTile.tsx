import Navigate from "@components/Navigate";
import { acceptCollaboratorInvitation, acceptManagerInvitation, rejectCollaboratorInvitation } from "@lib/frontend/helpers/mutations";
import { timeAgo } from "@lib/shared/utils";
import { NotificationModelType } from "@type/models";
import ParloImage from "./ParloImage/ParloImage";
import OptionalChildren from "./OptionalChildren";
import Button from "./Button";

const RequestBar = ({ type, status, request_type, metadata }: Required<Pick<NotificationModelType, "type" | "status" | "request_type" | "metadata">>) => {
    if (type === "informative") return;

    const handleAction = (accept: boolean) => {
        if (request_type === "collaborator_invitation" && "shelf_id" in metadata) {
            if (accept) acceptCollaboratorInvitation(metadata.shelf_id);
            else rejectCollaboratorInvitation(metadata.shelf_id);
        } else if (request_type === "manager_invitation" && "thread_id" in metadata) {
            if (accept) acceptManagerInvitation(metadata.thread_id);
            else rejectCollaboratorInvitation(metadata.thread_id);
        }
    }

    if (status === "pending") return (
        <div className="flex mt-4 gap-2">
            <Button
                title="Accept Request"
                className="flex-1 primary"
                onClick={() => handleAction(true)}>
                Accept
            </Button>
            <Button
                title="Deny Request"
                className="flex-1 secondary"
                onClick={() => handleAction(false)}>
                Deny
            </Button>
        </div>
    )
    return (
        <p className={`text-sm ${status === "accepted" ? "text-green-500" : "text-red-500"}`}>Status: {status}</p>
    )
}

const NotificationTile = ({ message, type, request_type, status, poster, createdAt, metadata }: Required<NotificationModelType>) => {
    return (
        <article className="px-2 py-4 my-2 space-y-3 wrap-anywhere border border-gray10 rounded-md bg-gray10">

            <div className="flex gap-3">
                <OptionalChildren condition={poster}>
                    <ParloImage
                        frameType="userProfile"
                        size={48}
                        className="size-12 min-w-12 object-cover rounded-md"
                        alt="Poster of the notification"
                        frame={poster}
                    />
                </OptionalChildren>
                <section>
                    <p>
                        {message.map((m, i) => {
                            if (m.type === "text") return m.text + ' ';
                            else return (
                                <Navigate key={i} comp="link" className="no-underline inline font-semibold" goto={m.path}>
                                    {m.label + ' '}
                                </Navigate>
                            )
                        })}
                    </p>
                </section>
            </div>

            <RequestBar metadata={metadata} status={status} type={type} request_type={request_type} />

            <p className="text-sm ghostColor">{timeAgo(createdAt)}</p>

        </article>
    )
}

export default NotificationTile;