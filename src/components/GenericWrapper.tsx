"use client";

import { useQueryHook } from "@lib/frontend/hooks";
import { isValidParloId } from "@lib/shared/utils";
import useCurrentUser from "@store/user";
import { GeneralGetReturn } from "@type/internal";
import { ErrorCodes } from "@type/other";
import { usePathname } from "next/navigation";
import LoginModal from "./fallbacks/LoginModal";
import { OptionalChildren } from "./ui";
import { NotFound, ShowError } from "./fallbacks";
import { FullPageLoadingSpinner } from "./ui/loading/LoadingSpinner";

type Func<T> = (...args: any[]) => Promise<GeneralGetReturn<T>>;

type QueryProps<T, F extends Func<T> = Func<T>> = {
    queryKeys: (string | number)[],
    queryFn: F,
    args: Parameters<F>,
    onSuccess?: (d: T) => void
}

type PropType = { id?: string, [key: string]: any } | null

type Props<T, P extends PropType> = {
    getQueryProps: (props: P) => QueryProps<T>,
    placeholderData?: T,
    props: P,
    needUser?: boolean,
    skipNotFound?: undefined | false,
    component: (data: T, props: P) => React.ReactElement | null | undefined,
    loadingComponent?: React.ReactNode;
}


const GenericWrapper = <T, P extends PropType>(
    { component, getQueryProps, props, needUser, skipNotFound, placeholderData, loadingComponent }: Props<T, P>
) => {
    const objectId = props?.id?.split('-')[0];
    const userObj = useCurrentUser();
    const pathname = usePathname();

    const { args, queryFn, queryKeys, onSuccess } = getQueryProps({ ...(props ?? {}), id: objectId } as P);

    const { data, error, isLoading, refetch } = useQueryHook<T>({
        queryKeys,
        queryFn: () => queryFn(...args) as ReturnType<Func<T>>,
        enabled: Boolean(objectId ? isValidParloId(objectId) : true) && Boolean(needUser ? userObj?.user : true),
        onSuccess,
        placeholderData,
    });

    if (objectId && !isValidParloId(objectId)) return (
        <NotFound
            title="Oops! Look's like you came across a wrong path."
            paras={["Content id is incorrect", "Please go back and try again."]}
            fullScreen
        />
    );

    else if (isLoading || (needUser && !userObj.isHydrated)) return (
        <OptionalChildren condition={!!loadingComponent} fallback={<FullPageLoadingSpinner />}>
            {loadingComponent}
        </OptionalChildren>
    )

    else if (needUser && !userObj.meta) return (
        <LoginModal redirectTo={pathname} />
    )

    else if (error) return (
        <ShowError
            heading="Oops! Looks like we could'nt proceed"
            errCode={error.message as ErrorCodes}
            retry={refetch}
        />
    )

    else if (!data && !skipNotFound) return (
        <NotFound
            title="Oops! Looks like the popcorn is missing."
            paras={[
                "Reason: The resource you're looking for might have been deleted.",
                "Please search it using it's name, title, username, etc. in the explore page."
            ]}
        />
    )

    return component(data as T, props);
}

export default GenericWrapper;