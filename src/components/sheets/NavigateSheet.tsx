"use client";

import { BottomSheet, BottomSheetRef, ShareButton } from "@components";
import { OptionList } from "@components/ui";
import { parloculaAppURL } from "@lib/shared/constants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VisitIcon, CopyIcon } from "@assets/Icons"

const NavigationSheet = ({ sheetRef, href }: { sheetRef: React.RefObject<BottomSheetRef | null>, href: string }) => {

    const router = useRouter();
    const url = new URL(href, parloculaAppURL).href;

    const handleCopy = () => {
        if (navigator && "clipboard" in navigator) {
            navigator.clipboard.writeText(url)
                .then(() => toast.success("Link copied to clipboard"));
        } else {
            toast.error("Unable to copy link to clipboard");
        }
    }

    const handleVisit = () => {
        router.push(href);
    }

    return (
        <BottomSheet allowHandle ref={sheetRef}>
            <section className="space-y-2 overflow-x-hidden">
                <p className="p-2 w-full text-sky-500 wrap-anywhere whitespace-break-spaces max-h-40 overflow-y-auto noScroll">{url}</p>
                <ul>
                    <OptionList onClick={handleVisit} className="justify-start">
                        <VisitIcon />
                        <span>Visit</span>
                    </OptionList>
                    <OptionList onClick={handleCopy} className="justify-start">
                        <CopyIcon />
                        <span>Copy Link</span>
                    </OptionList>
                </ul>
            </section>
        </BottomSheet>
    )
}

export default NavigationSheet;