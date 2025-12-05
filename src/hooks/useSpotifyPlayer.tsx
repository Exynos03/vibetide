"use client";

import { useState, useEffect, useRef } from "react";
import { SpotifyPlayer, SpotifyPlayerState } from "@/types/spotify";

declare global {
    interface Window {
        Spotify: {
            Player: new (options: {
                name: string;
                getOAuthToken: (cb: (token: string) => void) => void;
                volume: number;
            }) => SpotifyPlayer;
        };
        onSpotifyWebPlaybackSDKReady: () => void;
    }
}

export function useSpotifyPlayer() {
    const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [playerState, setPlayerState] = useState<SpotifyPlayerState | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const initializerRef = useRef<(() => void) | null>(null);

    // Fetch access token
    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await fetch('/api/auth/spotify/token');
                if (response.ok) {
                    const data = await response.json();
                    setAccessToken(data.accessToken);
                    console.log('✅ Access token fetched successfully');
                } else {
                    console.log('❌ No access token available (not authenticated)');
                }
            } catch (error) {
                console.error('Error fetching access token:', error);
            }
        };

        fetchToken();
    }, []);

    // Initialize Spotify Player
    useEffect(() => {
        if (!accessToken) return;

        const initializePlayer = () => {
            console.log('🎵 Initializing Spotify Player...');

            if (!window.Spotify) {
                console.error('❌ Spotify SDK not loaded');
                return;
            }

            const spotifyPlayer = new window.Spotify.Player({
                name: 'VibeTide Player',
                getOAuthToken: (cb) => {
                    cb(accessToken);
                },
                volume: 0.5,
            });

            // Ready event
            spotifyPlayer.addListener('ready', ({ device_id }: any) => {
                console.log('✅ Spotify Player Ready with Device ID:', device_id);
                setDeviceId(device_id);
                setIsReady(true);
            });

            // Not Ready event
            spotifyPlayer.addListener('not_ready', ({ device_id }: any) => {
                console.log('⚠️ Device ID has gone offline:', device_id);
                setIsReady(false);
            });

            // Player state changed
            spotifyPlayer.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
                if (!state) return;
                setPlayerState(state);
                setIsPlaying(!state.paused);
            });

            // Connect to the player
            spotifyPlayer.connect().then((success: boolean) => {
                if (success) {
                    console.log('✅ Spotify Player connected');
                } else {
                    console.error('❌ Spotify Player connection failed');
                }
            });

            setPlayer(spotifyPlayer);
        };

        // Store initializer in ref
        initializerRef.current = initializePlayer;

        // Set up global callback BEFORE checking if SDK is loaded
        if (typeof window !== 'undefined') {
            window.onSpotifyWebPlaybackSDKReady = () => {
                console.log('🎵 Spotify SDK Ready callback fired');
                if (initializerRef.current) {
                    initializerRef.current();
                }
            };
        }

        // Load SDK script if not present
        if (!document.getElementById('spotify-player-script')) {
            console.log('📥 Injecting Spotify SDK script...');
            const script = document.createElement('script');
            script.id = 'spotify-player-script';
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            document.body.appendChild(script);
        }

        // If SDK is already loaded, initialize immediately
        if (window.Spotify) {
            console.log('🎵 Spotify SDK already loaded, initializing...');
            initializePlayer();
        } else {
            console.log('⏳ Waiting for Spotify SDK to load...');
        }

        return () => {
            if (player) {
                console.log('🔌 Disconnecting Spotify Player');
                player.disconnect();
            }
        };
    }, [accessToken]);

    const playTrack = async (uri: string) => {
        if (!deviceId || !accessToken) return;

        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [uri] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            console.error('Error playing track:', error);
        }
    };

    const togglePlay = async () => {
        if (!player) return;
        await player.togglePlay();
    };

    const nextTrack = async () => {
        if (!player) return;
        await player.nextTrack();
    };

    const previousTrack = async () => {
        if (!player) return;
        await player.previousTrack();
    };

    const seek = async (position: number) => {
        if (!player) return;
        await player.seek(position);
    };

    const setVolume = async (volume: number) => {
        if (!player) return;
        await player.setVolume(volume);
    };

    return {
        player,
        isReady,
        deviceId,
        playerState,
        isPlaying,
        playTrack,
        togglePlay,
        nextTrack,
        previousTrack,
        seek,
        setVolume,
        currentTrack: playerState?.track_window?.current_track || null,
        position: playerState?.position || 0,
        duration: playerState?.duration || 0,
    };
}
