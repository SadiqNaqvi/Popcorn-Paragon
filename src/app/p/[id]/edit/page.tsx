import { CreateEditPost } from "@components";
import LoginModal from "@components/fallbacks/LoginModal";
import { NotFound, ShowError } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils";
import { getPostById } from "@lib/shared/helpers/internal_fetchers";
import { fetchQuery, getQueryClient } from "@lib/backend/providers/queryClient";
import { getQueryKeys } from "@lib/shared/utils";
import { ParloPageProps } from "@type/other";
import { cookies } from "next/headers";

const Page = async ({ params }: ParloPageProps) => {

    const { id } = await params;

    const queryClient = getQueryClient();
    const jar = await cookies();
    const user = await getUserFromToken(jar);

    const post = await fetchQuery({
        queryClient,
        queryKey: getQueryKeys("post_id", { id }),
        queryFn: () => getPostById(id),
    });

    if (!user) return <LoginModal />

    else if (!post) return (
        <NotFound
            title="Uh oh! The Parlocula Explorers came empty handed"
            paras={[
                "No post could be found with the provided id", "Please visit the post or search by title in the search page"
            ]}
            fullScreen
            redirectToExplore
        />
    )

    else if (user.user_id !== post.user_id) return (
        <ShowError
            heading="Uh oh! The Parlocula Guards detained you"
            messages={[
                "Seems like you are not the author of the post."
            ]}
            fullScreen
        />
    )

    return (
        <CreateEditPost
            isEditing={true}
            defaultVal={post}
            defaultThread={undefined}
            quotedPost={undefined}
        />
    )
}

export default Page;