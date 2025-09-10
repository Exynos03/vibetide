"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { audioFetcher, AudioMetadata } from "@/utils/audioFetcher";

export function useRangeAudioPlayer(tracks: string[]) {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [seek, setSeek] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const metadataRef = useRef<AudioMetadata | null>(null);
  const preloadedRanges = useRef<Set<string>>(new Set());

  const loadTrack = useCallback(async (trackPath: string) => {
    if (!audioRef.current) return;

    setIsLoading(true);
    setError(null);
    setSeek(0);

    try {
      // Get metadata first
      const metadata = await audioFetcher.getMetadata(trackPath);
      metadataRef.current = metadata;
      setDuration(metadata.duration);

      // Create streaming blob URL
      const blobUrl = await audioFetcher.createStreamingBlob(trackPath);
      
      // Clean up previous blob URL
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current.src = blobUrl;
      audioRef.current.load();

      // Preload the beginning of the track for immediate playback
      preloadRange(trackPath, { start: 0, end: 1024 * 1024 }); // 1MB

    } catch (err) {
      setError(`Failed to load track: ${err}`);
      setIsLoading(false);
    }
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
      
      // Set up event listeners
      audioRef.current.addEventListener('loadstart', () => setIsLoading(true));
      audioRef.current.addEventListener('canplay', () => setIsLoading(false));
      audioRef.current.addEventListener('error', (e) => {
        setError(`Audio error: ${e}`);
        setIsLoading(false);
      });
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setSeek(audioRef.current.currentTime);
        }
      });
      audioRef.current.addEventListener('ended', () => handleNextRef.current());
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('loadstart', () => setIsLoading(true));
        audioRef.current.removeEventListener('canplay', () => setIsLoading(false));
        audioRef.current.removeEventListener('error', (e) => setError(`Audio error: ${e}`));
        audioRef.current.removeEventListener('timeupdate', () => {
          if (audioRef.current) {
            setSeek(audioRef.current.currentTime);
          }
        });
        audioRef.current.removeEventListener('ended', () => handleNextRef.current());
      }
    };
  }, []);

  // Load track when currentTrack changes
  useEffect(() => {
    loadTrack(tracks[currentTrack]);
  }, [currentTrack, tracks, loadTrack]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const preloadRange = async (trackPath: string, range: { start: number; end: number }) => {
    const rangeKey = `${trackPath}:${range.start}-${range.end}`;
    
    if (preloadedRanges.current.has(rangeKey)) {
      return;
    }

    try {
      await audioFetcher.preloadRange(trackPath, range);
      preloadedRanges.current.add(rangeKey);
    } catch (err) {
      console.warn('Failed to preload range:', err);
    }
  };

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        setError(`Playback error: ${err}`);
      });
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleNext = useCallback(() => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;

  const handlePrev = useCallback(() => {
    setCurrentTrack((prev) =>
      prev === 0 ? tracks.length - 1 : prev - 1
    );
    setIsPlaying(true);
  }, [tracks.length]);

  const handleSeek = useCallback((newSeek: number) => {
    if (!audioRef.current || !metadataRef.current) return;

    const seekTime = Math.max(0, Math.min(newSeek, duration));
    
    // If seeking to a position that's not preloaded, preload that range
    const seekPosition = Math.floor(seekTime);
    const rangeStart = Math.max(0, seekPosition * 1024 * 1024 - 512 * 1024); // 512KB before
    const rangeEnd = Math.min(
      metadataRef.current.size,
      seekPosition * 1024 * 1024 + 1024 * 1024 // 1MB after
    );

    preloadRange(tracks[currentTrack], { start: rangeStart, end: rangeEnd });

    audioRef.current.currentTime = seekTime;
    setSeek(seekTime);
  }, [duration, tracks, currentTrack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioFetcher.clearCache();
    };
  }, []);

  return {
    currentTrack,
    isPlaying,
    volume,
    duration,
    seek,
    isLoading,
    error,
    setVolume,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    trackName: tracks[currentTrack]?.split("/").pop() || '',
  };
}
