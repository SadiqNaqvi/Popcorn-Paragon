"use client";

import { useHistoryStack } from "@lib/frontend/hooks";
import { Frame } from "@type/internal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { BottomSheetRef } from "./BottomSheet";
import NavigationSheet from "./sheets/NavigateSheet";
import { HistoryStackType } from "@type/other";
import { Button } from "./ui";

export type NavigateComponentProps = {
    children: React.ReactNode;
    comp: "button" | "link";
    historyPayload?: Omit<HistoryStackType, "path">,
    goto: string;
    preload?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>


const Navigate = ({ children, comp, goto, type, className, preload=false, onContextMenu, historyPayload, ...args }: NavigateComponentProps) => {

    const navigator = useRouter();
    const pathname = usePathname();
    const sheetRef = useRef<BottomSheetRef>(null);
    const { pushInStack } = useHistoryStack();

    const handleNavigation = (e: any) => {
        e.preventDefault();

        if (goto === pathname) return;

        else if (goto === "back") {
            navigator.back();
            return;
        }

        if (historyPayload) pushInStack({ ...historyPayload, path: goto });

        navigator.push(goto);
    }

    const handleContextMenu = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        sheetRef.current?.open();
    }

    if (comp === "button") return (
        <>
            <NavigationSheet sheetRef={sheetRef} href={goto} />
            <button
                {...args}
                onContextMenu={onContextMenu ?? handleContextMenu}
                type="button"
                className={className}
                onClick={handleNavigation}
            >
                {children}
            </button>
        </>
    )

    else return (
        <>
            <NavigationSheet sheetRef={sheetRef} href={goto} />
            <Link
                {...args}
                prefetch={preload}
                href={goto}
                onClick={handleNavigation}
                onContextMenu={onContextMenu ?? handleContextMenu}
                className={className}
            >
                {children}
            </Link>
        </>
    );
}

export default Navigate;