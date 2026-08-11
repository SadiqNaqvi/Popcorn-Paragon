import AccountDeletionWarning from "@components/EmailTemplates/accountDeletion";
import { deleteSession } from "@lib/backend/auth/session";
import { oneDayInMiliSeconds, parloculaAppURL } from "@lib/shared/constants";
import { updateHandler } from "@lib/backend/helpers/handlers";
import { sendEmail } from "@lib/backend/actions/email";
import { User } from "@model";
import { render } from "@react-email/components";
import { Client } from "@upstash/qstash";
import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const client = new Client({
    token: process.env.UPSTASH_TOKEN!
});
// Add that user can reuqest deletion only once a month.
export const PATCH = updateHandler<{ passkey: string }>({
    handler: async ({ data, user_id, session, username }) => {
        const { passkey } = data;

        const user = await User.findById(user_id);

        if (!passkey || !user || !bcrypt.compareSync(passkey, user.passkey))
            return { success: false, errCode: "unauthorized_access" }

        const now = Date.now();
        const deleteOn = now + (30 * oneDayInMiliSeconds);

        // It is scheduled to run on every 6 days, until day 30, to warn user about their account deletion;
        const interval = now + (6 * oneDayInMiliSeconds);

        const job = await client.publishJSON({
            url: `${parloculaAppURL}/api/v1/user/account_deletion`,
            notBefore: (interval / 1000),
            method: "POST",
            body: {
                deleteOn, user_id,
                scheduledOn: now,
                passkey, times: 1,
            }
        });

        await User.findByIdAndUpdate(
            user_id,
            { deletionId: job.messageId, isActive: false },
            { session }
        );

        await deleteSession(user.session_id);

        const template = await render(AccountDeletionWarning({
            deleteOn,
            username,
            warning: null,
            userDocsCount: {
                comments: user.comments || 0,
                createdThreads: user.createdThreads || 0,
                followers: user.comments || 0,
                following: user.following || 0,
                joinedThreads: user.joinedThreads || 0,
                likes: user.likes || 0,
                posts: user.posts || 0,
                publicShelves: user.publicShelves || 0,
                reactions: user.reactions || 0,
                rooms: user.rooms || 0,
                savedContents: user.savedContents || 0,
            }
        }));

        await sendEmail({ email: user.email, template, subject: "Account Deletion Update" });

        const jar = await cookies()
        jar.delete("sid");
        jar.delete("token");

        return {
            success: true,
            result: null,
            revalidateQueue: [],
        }

    }
})