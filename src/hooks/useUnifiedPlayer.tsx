"use client";

import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import { useAudioPlayer } from "./useAudioPlayer";
import { useSpotifyPlayer } from "./useSpotifyPlayer";
import { PlayerSource, UnifiedTrack } from "@/types/spotify";

export function useUnifiedPlayer(localTracks: string[]) {
    const [source, setSource] = useState<PlayerSource>('local');
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [playlist, setPlaylist] = useState<UnifiedTrack[]>([]);

    // Initialize local player
    const localPlayer = useAudioPlayer(localTracks);

    // Initialize Spotify player
    const spotifyPlayer = useSpotifyPlayer();

    // Convert local tracks to unified format
    useEffect(() => {
        const unifiedLocalTracks: UnifiedTrack[] = localTracks.map((track, index) => ({
            id: `local-${index}`,
            name: track.split('/').pop()?.replace(/\.(mp3|wav|m4a)$/i, '') || 'Unknown',
            artist: 'Local',
            duration: 0, // Will be updated when track loads
            source: 'local',
            url: track,
            waveformUrl: "/output-audio/" + track.split("/").pop()!.replace(/\.(mp3|wav|m4a)$/i, ".json"),
        }));
        setPlaylist(unifiedLocalTracks);
    }, [localTracks]);

    // Unified interface
    const isPlaying = source === 'local' ? localPlayer.isPlaying : spotifyPlayer.isPlaying;
    const duration = source === 'local' ? localPlayer.duration : (spotifyPlayer.duration / 1000);
    const seek = source === 'local' ? localPlayer.seek : (spotifyPlayer.position / 1000);

    const handlePlayPause = () => {
        if (source === 'local') {
            localPlayer.handlePlayPause();
        } else {
            spotifyPlayer.togglePlay();
        }
    };

    const handleNext = () => {
        if (source === 'local') {
            localPlayer.handleNext();
        } else {
            spotifyPlayer.nextTrack();
        }
    };

    const handlePrev = () => {
        if (source === 'local') {
            localPlayer.handlePrev();
        } else {
            spotifyPlayer.previousTrack();
        }
    };

    const handleSeek = (newSeek: number) => {
        if (source === 'local') {
            localPlayer.handleSeek(newSeek);
        } else {
            spotifyPlayer.seek(newSeek * 1000); // Convert to ms
        }
    };

    const handleVolumeChange = (volume: number) => {
        if (source === 'local') {
            localPlayer.setVolume(volume);
        } else {
            spotifyPlayer.setVolume(volume);
        }
    };

    const switchSource = (newSource: PlayerSource) => {
        // Pause current playback
        if (isPlaying) {
            handlePlayPause();
        }
        setSource(newSource);
    };

    const playSpotifyTrack = (uri: string, track: UnifiedTrack) => {
        setSource('spotify');
        spotifyPlayer.playTrack(uri);
        // Could add track to playlist here
    };

    const getCurrentTrack = (): UnifiedTrack | null => {
        if (source === 'local') {
            return playlist[localPlayer.currentTrack] || null;
        } else if (spotifyPlayer.currentTrack) {
            return {
                id: spotifyPlayer.currentTrack.id,
                name: spotifyPlayer.currentTrack.name,
                artist: spotifyPlayer.currentTrack.artists.map(a => a.name).join(', '),
                duration: spotifyPlayer.currentTrack.duration_ms / 1000,
                source: 'spotify',
                spotifyUri: spotifyPlayer.currentTrack.uri,
                albumArt: spotifyPlayer.currentTrack.album.images[0]?.url,
                spotifyId: spotifyPlayer.currentTrack.id,
            };
        }
        return null;
    };

    return {
        // State
        source,
        isPlaying,
        duration,
        seek,
        currentTrack: getCurrentTrack(),
        volume: source === 'local' ? localPlayer.volume : 0.5,

        // Spotify specific
        spotifyReady: spotifyPlayer.isReady,
        spotifyDeviceId: spotifyPlayer.deviceId,

        // Controls
        handlePlayPause,
        handleNext,
        handlePrev,
        handleSeek,
        handleVolumeChange,
        switchSource,
        playSpotifyTrack,

        // Local player reference (for waveform)
        localCurrentTrackIndex: localPlayer.currentTrack,
    };
}
