"use client";

import { ErrorFaceIcon } from "@assets/Icons";
import Navbar from "@components/Navbar";
import { Button, OptionalChildren } from "@components/ui";
import { codetoError } from "@lib/shared/utils";
import { ErrorCodes } from "@type/other";
import { twMerge } from "tailwind-merge";

type Props = {
    heading: string,
    retry?: () => any
    messages?: string[]
    errCode?: ErrorCodes,
    fullScreen?: boolean,
    className?: string;
}

const ShowError = ({ heading, errCode, messages = [], retry, fullScreen, className }: Props) => {
    return (
        <>
            <OptionalChildren condition={fullScreen}>
                <Navbar />
            </OptionalChildren>
            <div className={twMerge("h-size-screen flex flex-cntr-all flex-col gap-3", className)}>

                <ErrorFaceIcon className="size-32 sm:size-40 mx-auto" />

                <h4 className="text-lg sm:text-xl text-center">{heading || "Oh ho! Error Encountered"}</h4>

                {errCode &&
                    <p className="text-sm ghostColor text-center">{codetoError(errCode) as string}</p>
                }

                {messages.map((msg, ind) => (
                    <p key={ind} className="text-xs ghostColor text-center space-y-2">{msg}</p>
                ))}

                <OptionalChildren condition={!!retry}>
                    <Button
                        id="retry-button"
                        title="Try Again"
                        className="secondary mx-auto"
                        onClick={retry}
                    >
                        Try again
                    </Button>
                </OptionalChildren>

            </div>
        </>
    )
}

export default ShowError;