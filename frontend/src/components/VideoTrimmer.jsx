import React, { useState, useRef, useEffect } from 'react';
import { Scissors, Play, Pause } from 'lucide-react';
import config from '../config';

const VideoTrimmer = ({ file, onTrimConfirm, onCancel }) => {
    const videoRef = useRef(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Trim values in seconds
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);

    const [videoUrl, setVideoUrl] = useState(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            setEndTime(dur);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);

            // Loop check
            if (time >= endTime) {
                videoRef.current.pause();
                setIsPlaying(false);
                videoRef.current.currentTime = startTime;
            }
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                // Should seek to start if out of bounds?
                if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
                    videoRef.current.currentTime = startTime;
                }
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-panel p-6 animate-fade-in relative">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-primary" /> Trim Video
                </h3>
                <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                    Change Video
                </button>
            </div>

            {/* Video Preview */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-6 border border-white/10">
                {videoUrl && (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                    />
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {!isPlaying && (
                        <div className="p-4 rounded-full bg-black/50 backdrop-blur-sm pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
                            onClick={togglePlay}>
                            <Play className="w-8 h-8 text-white fill-current" />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
                <div className="flex justify-between text-sm font-mono text-gray-300">
                    <div>Start: {formatTime(startTime)}</div>
                    <div className="text-primary">{formatTime(currentTime)}</div>
                    <div>End: {formatTime(endTime)}</div>
                </div>

                {/* Range Sliders */}
                <div className="relative h-12 select-none touch-none">
                    {/* Track Background */}
                    <div className="absolute top-1/2 left-0 right-0 h-2 bg-white/10 rounded-full transform -translate-y-1/2"></div>

                    {/* Selected Range Track */}
                    <div
                        className="absolute top-1/2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full transform -translate-y-1/2 pointer-events-none"
                        style={{
                            left: `${(startTime / duration) * 100}%`,
                            right: `${100 - (endTime / duration) * 100}%`
                        }}
                    ></div>

                    {/* Start Handle */}
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={startTime}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val < endTime - 1) { // Min 1s segment
                                setStartTime(val);
                                if (videoRef.current) videoRef.current.currentTime = val;
                            }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-10"
                        style={{
                            clipPath: `inset(0 ${100 - (startTime / duration) * 100}% 0 0)` // Only interactable on left
                        }}
                    />
                    {/* End Handle */}
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={endTime}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val > startTime + 1) {
                                setEndTime(val);
                                if (videoRef.current) videoRef.current.currentTime = val;
                            }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-20"
                        style={{
                            clipPath: `inset(0 0 0 ${(endTime / duration) * 100}%)` // Hmmm logic for dual inputs over same area is tricky with pure CSS
                            // Simpler visual indicators:
                        }}
                    />

                    {/* Visual Thumbs (Since standard range inputs overlap weirdly) */}
                    {/* We can use standard inputs just positioned or custom div handles */}
                    {/* For speed, let's just use two basic inputs stacked? Or just use one if possible? No. */}
                    {/* Let's simplify: Two standard range sliders below each other is ugly. */}
                    {/* Let's use two flex inputs for precise control, and maybe a simple visual bar ? */}
                </div>

                {/* Precision Inputs */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">Start Time (s)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={endTime - 1}
                            value={startTime}
                            onChange={(e) => setStartTime(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">End Time (s)</label>
                        <input
                            type="number"
                            step="0.1"
                            min={startTime + 1}
                            max={duration}
                            value={endTime}
                            onChange={(e) => setEndTime(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onTrimConfirm(startTime, endTime)}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Scissors className="w-4 h-4" /> Analyze Selected Clip
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoTrimmer;
