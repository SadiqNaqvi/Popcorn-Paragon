import AccountDeleted from "@components/EmailTemplates/accountDeleted";
import AccountDeletionWarning from "@components/EmailTemplates/accountDeletion";
import { oneDayInMiliSeconds, parloculaAppURL } from "@lib/shared/constants";
import { connectDatabase } from "@lib/backend/providers/database";
import { deleteUser } from "@lib/backend/helpers/deletion";
import { sendEmail } from "@lib/backend/actions/email";
import { User } from "@model";
import { render } from "@react-email/components";
import { GenericDate } from "@type/internal";
import { Client, Receiver } from "@upstash/qstash";
import { compareSync } from "bcryptjs";
import type { ClientSession } from "@type/mongoose";
import { NextRequest, NextResponse } from "next/server";

type Payload = {
    deleteOn: GenericDate,
    user_id: string,
    scheduledOn: GenericDate,
    passkey: string,
    times: number,
}

const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export const POST = async (req: NextRequest) => {

    const body = await req.text();

    const signature = req.headers.get("Upstash-Signature") || req.headers.get("upstash-signature");

    if (!signature) return NextResponse.json({ error: "Signature is not provided" }, { status: 402 })

    const isValid = await receiver.verify({
        body,
        signature,
        url: `${parloculaAppURL}/api/v1/user/account_deletion`,
    });

    if (!isValid)
        return NextResponse.json({ error: "Invalid request!" }, { status: 402 })

    const data: Payload = JSON.parse(body);

    const { user_id, deleteOn, passkey, times } = data;

    let session: ClientSession | null = null;

    try {

        const connection = await connectDatabase();
        if (!connection) return NextResponse.json({
            result: null,
            success: false,
            errCode: "database_connection_fail",
        });

        const user = await User.findById(user_id);

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        else if (user.isActive || !(user.deletionId && compareSync(passkey, user.passkey)))
            return NextResponse.json({ error: "Deletion has been cancelled" }, { status: 200 });

        const now = Date.now();
        session = await connection.startSession();

        // Check is time for deletion;
        if (now >= new Date(data.deleteOn).getTime()) {

            // Its time for deletion

            await deleteUser(user._id!, session, user.profile?.path);

            await sendEmail({
                email: user.email,
                subject: "Parlocula Account Deleted",
                template: await render(AccountDeleted({ username: user.username }))
            });

        } else {
            const client = new Client({
                token: process.env.UPSTASH_TOKEN!
            });

            const interval = Date.now() + (6 * oneDayInMiliSeconds);

            const thisTime = times + 1;

            const job = await client.publishJSON({
                url: `${parloculaAppURL}/api/v1/user/account_deletion`,
                notBefore: (interval / 1000),
                method: "POST",
                body: { ...data, times: thisTime },
            });

            await User.findByIdAndUpdate(user_id, { deletionId: job.messageId }, { session });

            if (thisTime % 2 !== 0) {
                const template = await render(AccountDeletionWarning({
                    deleteOn,
                    username: user.username,
                    warning: thisTime === 3 ? "first" : "last",
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

                await sendEmail({ email: user.email, template, subject: "Account Deletion Warning" })
            }
        }

        await session.commitTransaction();

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (e: any) {
        console.error("Error occured while deleting user");

        await session?.abortTransaction();
        return NextResponse.json({ error: "Unknown Error" }, { status: 500 })
    }
}