import { PostMutation } from "@components/form/Mutation";
import { getUserFromToken } from "@lib/backend/utils";
import { getPostById, getThreadById } from "@lib/shared/helpers/internal_fetchers";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { FullPost, Thread } from "@type/internal";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";

type SearchParams = { tid: string, qpid: string }

export const metadata = generateDynamicMetadata({ title: "Create New Post" });

const getThreadAndQuotedPost = async ({ qpid, tid }: Partial<SearchParams>) => {
    let thread: Thread | undefined = undefined;
    let quotedPost: FullPost | undefined = undefined;

    if (tid) {
        const { success, result } = await getThreadById(tid);

        if (success && result) thread = result;
    }

    if (qpid) {
        const { success, result } = await getPostById(qpid);

        if (success && result) quotedPost = result;
    }

    return { thread, quotedPost }
}

const CreatePostPage = async ({ searchParams }: ParloPageProps<any, SearchParams>) => {
    const jar = await cookies();
    const user = await getUserFromToken(jar);

    if (!user) return;

    const sp = await searchParams;

    const { quotedPost, thread } = await getThreadAndQuotedPost(sp);

    return (
        <PostMutation
            isEditing={false}
            defaultThread={thread}
            quotedPost={quotedPost}
            defaultVal={undefined}
        />
    )
}

export default CreatePostPage;