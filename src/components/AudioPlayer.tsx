"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const tracks = [
  "audio/coffee-lofi-chill-lofi-music-332738.mp3",
  "audio/good-night-lofi-cozy-chill-music-160166.mp3",
  "audio/lofi-girl-lofi-hiphop-beats-328177.mp3",
  "audio/lofi-rain-lofi-music-332732.mp3",
  "audio/ocean-lofi-vibes-lofi-music-340023.mp3",
  "audio/whispering-vinyl-loops-lofi-beats-281193.mp3",
];

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function AudioPlayer() {
  const {
    isPlaying,
    volume,
    seek,
    duration,
    setVolume,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    trackName,
  } = useAudioPlayer(tracks);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-100 rounded-xl shadow-md w-[320px]">
      <h2 className="text-lg font-semibold text-black">
        Playing: {trackName}
      </h2>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={handlePrev}
          className="px-4 py-2 bg-gray-300 rounded-lg"
        >
          ⏮ Prev
        </button>
        <button
          onClick={handlePlayPause}
          className="px-4 py-2 bg-blue-500 text-black rounded-lg"
        >
          {isPlaying ? "⏸ Pause" : "▶️ Play"}
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-gray-300 rounded-lg"
        >
          ⏭ Next
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs">{formatTime(seek)}</span>
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={seek}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs">{formatTime(duration)}</span>
      </div>

      {/* Volume */}
      <div className="flex flex-col items-center">
        <label className="text-sm text-black">Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-40"
        />
      </div>
    </div>
  );
}
