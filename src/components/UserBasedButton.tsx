"use client";

import { useQueryHook } from "@lib/frontend/hooks";
import { AvailableMutations, MutationFunctionAgruments, performMutation, setMutation } from "@lib/frontend/providers/mutationStore";
import { useQueryClient } from "@tanstack/react-query";
import { ReactElement, useRef } from "react";
import BottomSheet from "./BottomSheet";
import { LoginModal } from "./fallbacks";
import { OptionalChildren } from "./ui";

type OnClickFunc = <M extends AvailableMutations, T>(newState: T, action: M, args: MutationFunctionAgruments<M>) => void

export type UserBasedButtonProps<T> = {
    state: T | null | undefined;
    user_id: string;
    onClick: OnClickFunc;
};

type Props<T> = {
    queryKeys: string[],
    uid: string | undefined,
    queryFn: (user_id: string) => Promise<any>,
    Button: (arg: UserBasedButtonProps<T>) => ReactElement,
    errorStateClassName?: string,
    noUserStateChilren: React.ReactNode,
    noUserStateClassName?: string,
    Loading?: React.ReactNode,
    ErrorComponent?: React.ReactNode,
    redirectAfterLogin?: string,
    buttonTitle?: string;
}

export const LoadingButton = ({ primary = true }: { primary?: boolean }) => (
    <div className={primary ? "py-2 px-4 bg-secondary rounded-md gap-3" : undefined}>
        <span className="animate-spin size-3 inline-flex rounded-full border-2 border-b-transparent border-gray-500 aspect-square"></span>
        {primary && <span>Loading...</span>}
    </div>
);

const UserBasedButton = <T,>({ Button, buttonTitle, queryFn, queryKeys, errorStateClassName, ErrorComponent, redirectAfterLogin, noUserStateChilren, noUserStateClassName, Loading, uid }: Props<T>) => {

    const queryClient = useQueryClient();

    const mutation_id = queryKeys.join("-");

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const { data, error, isLoading, refetch } = useQueryHook<T>({
        queryFn: () => queryFn(uid ?? ""),
        queryKeys,
        enabled: Boolean(uid),
    });

    if (!uid) return (
        <BottomSheet
            button={noUserStateChilren}
            className={noUserStateClassName}
            buttonTitle={buttonTitle}
        >
            <LoginModal
                redirectTo={redirectAfterLogin}
                skipFullScreen
                desc={[
                    "You have been arrested by the Parlocula Cops",
                    "Looks like you need to log-in to perform this action",
                ]}
            />
        </BottomSheet>

    )

    const LoadingComponent = Loading ?? <LoadingButton />;

    if (isLoading) return LoadingComponent;

    else if (error) return (
        <OptionalChildren condition={!ErrorComponent} fallback={ErrorComponent}>
            <button
                title="Retry"
                aria-label="Retry"
                onClick={() => refetch()}
                className={errorStateClassName || "secondary"}>
                ⚠Try Again
            </button>
        </OptionalChildren>
    )

    const handleClick = <M extends AvailableMutations, T>(newState: T, action: M, args: MutationFunctionAgruments<M>) => {

        // Optimistic update
        queryClient.setQueryData(queryKeys, newState);

        // Save latest intent to local queue (overwrite)
        setMutation(mutation_id, { payload: args, type: action });

        // Trigger debounce logic
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const previousState = queryClient.getQueryData(queryKeys);

            performMutation(mutation_id)
                .then(completed => {
                    if (!completed) {
                        queryClient.setQueryData(queryKeys, previousState);
                    }
                });

        }, 10000);
    };

    return <Button user_id={uid} state={data} onClick={handleClick} />
}

export default UserBasedButton;