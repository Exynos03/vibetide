"use client";

import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";

export function useAudioPlayer(tracks: string[]) {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0); // total track length
  const [seek, setSeek] = useState(0); // current playback position

  const soundRef = useRef<Howl | null>(null);
  const seekInterval = useRef<NodeJS.Timeout | null>(null);

  // Load track when currentTrack changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.unload();
    }

    const sound = new Howl({
      src: [tracks[currentTrack]],
      html5: true,
      volume,
      onload: () => setDuration(sound.duration()), // set track length
      onend: () => handleNext(),
    });

    soundRef.current = sound;

    if (isPlaying) {
      sound.play();
      startSeekUpdate();
    }

    return () => {
      sound.unload();
      stopSeekUpdate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Update volume
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
  }, [volume]);

  // Start updating seek every 500ms
  const startSeekUpdate = () => {
    stopSeekUpdate();
    seekInterval.current = setInterval(() => {
      if (soundRef.current && soundRef.current.playing()) {
        setSeek(soundRef.current.seek() as number);
      }
    }, 500);
  };

  const stopSeekUpdate = () => {
    if (seekInterval.current) {
      clearInterval(seekInterval.current);
      seekInterval.current = null;
    }
  };

  const handlePlayPause = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
      stopSeekUpdate();
      setIsPlaying(false);
    } else {
      soundRef.current.play();
      startSeekUpdate();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrack((prev) =>
      prev === 0 ? tracks.length - 1 : prev - 1
    );
    setIsPlaying(true);
  };

  const handleSeek = (newSeek: number) => {
    if (soundRef.current) {
      soundRef.current.seek(newSeek);
      setSeek(newSeek);
    }
  };

  return {
    currentTrack,
    isPlaying,
    volume,
    duration,
    seek,
    setVolume,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    trackName: tracks[currentTrack].split("/").pop(),
  };
}
