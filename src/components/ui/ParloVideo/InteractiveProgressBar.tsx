import React, { useRef, useState } from "react";
import { useGlobalOptions } from "./helpers";
import { formatTimeAsDuration } from "@lib/frontend/helpers/media";

const InteractiveProgressBar = () => {
    const { setProgress, progress, duration, videoRef } = useGlobalOptions();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [previewTime, setPreviewTime] = useState<number | null>(null);

    const updateVideoTime = () => {
        const vid = videoRef.current;
        if (!vid || !previewTime) return;

        vid.currentTime = previewTime;
        setProgress(previewTime)
    }

    const handleMouseDown = () => {
        setPreviewTime(progress);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPreviewTime(parseFloat(e.target.value));
    };

    const handleMouseUp = () => {
        updateVideoTime(); // only commit once user releases
        setPreviewTime(null)
    };

    const displayTime = ((previewTime || progress || 0) / (duration || 1)) * 100;

    return (
        <div className="flex flex-cntr-between gap-4 text-zinc-100 showShadow">
            <span className="text-sm">{formatTimeAsDuration(previewTime || progress || 0)}</span>
            <div className="progress-bar-container">
                <input
                    ref={inputRef}
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.01}
                    value={previewTime || progress || 0}
                    onMouseDown={handleMouseDown}
                    onChange={handleChange}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={updateVideoTime}
                    className="progress-bar"
                    style={{
                        background: `linear-gradient(to right, #f8f8ff ${displayTime}%, #444 0%)`,
                    }}
                />
            </div>
            <span className="text-sm">{formatTimeAsDuration(duration || 0)}</span>
        </div>
    );
};

export default InteractiveProgressBar;