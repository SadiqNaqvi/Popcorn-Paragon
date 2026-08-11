import { getUserFromToken } from "@lib/backend/utils";
import { cookies } from "next/headers";
import ReportedContentsSection from "../ReportedContentsSection";
import { ParloPageProps } from "@type/other";

const ReportedCommentsPage = async ({ params }: ParloPageProps) => {

    const user = await getUserFromToken(await cookies());
    if (!user) return null;

    const tid = (await params).id.split('-')[0];

    return <ReportedContentsSection tid={tid} uid={user.user_id} type="comment" />

}

export default ReportedCommentsPage;