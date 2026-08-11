"use client";

import { ExternalToast, toast } from "sonner";

export type ToastMessage = (() => React.ReactNode) | React.ReactNode;

type ToastTypes = "normal" | "success" | "error" | "warning" | "info"
type MessageProp<T extends ToastTypes> = T extends "custom" ? MessageForCustom : ToastMessage

type ToastId = string | number

type MessageForCustom = (id: ToastId) => React.ReactElement;

const defaultDuration = 10000;

const performToast = <T extends ToastTypes>(message: MessageProp<T>, options: ExternalToast, type: T) => {

    const { error, success, warning, info } = toast;

    if (type === "error") return error(message, options)

    else if (type === "success") return success(message, options)

    else if (type === "warning") return warning(message, options)

    else if (type === "info") return info(message, options)

    else return toast(message, options)
}

const showToast = <T extends ToastTypes>(message: MessageProp<T>, options?: ExternalToast, type?: ToastTypes) => {

    const duration = options?.duration || defaultDuration;

    const id = performToast(
        message,
        {
            ...(options || {}),
            duration: Infinity
        },
        type || "normal"
    );

    let remaining = duration;
    let start: number | null = null;
    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
        if (timer || remaining <= 0) return;
        start = Date.now();
        timer = setTimeout(() => {
            toast.dismiss(id);
            cleanup();
        },
            remaining);
    };

    const pauseTimer = () => {
        if (!timer) return;
        clearTimeout(timer);
        timer = null;
        if (start) {
            remaining -= Date.now() - start;
        }
    };

    const handleVisibilityChange = () => {
        if (document.hidden) {
            pauseTimer();
        } else {
            startTimer();
        }
    };

    const cleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    // 2. Watch for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Start timer if visible right now
    if (!document.hidden) startTimer();

    return id;
}

type ToastProps = [message: ToastMessage, options?: ExternalToast]

const appToast = {
    show: (...props: ToastProps) => showToast(...props),
    success: (...props: ToastProps) => showToast(props[0], props[1], "success"),
    error: (...props: ToastProps) => showToast(props[0], props[1], "error"),
    info: (...props: ToastProps) => showToast(props[0], props[1], "info"),
    warning: (...props: ToastProps) => showToast(props[0], props[1], "warning")
}

export default appToast;