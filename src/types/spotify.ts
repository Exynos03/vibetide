// Spotify API Types

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{
        id: string;
        name: string;
    }>;
    album: {
        id: string;
        name: string;
        images: Array<{
            url: string;
            height: number;
            width: number;
        }>;
    };
    duration_ms: number;
    uri: string;
    preview_url: string | null;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    images: Array<{
        url: string;
        height: number;
        width: number;
    }>;
    tracks: {
        total: number;
    };
    owner: {
        display_name: string;
    };
}

export interface SpotifyAudioAnalysis {
    segments: Array<{
        start: number;
        duration: number;
        loudness_start: number;
        loudness_max: number;
        loudness_max_time: number;
    }>;
    beats: Array<{
        start: number;
        duration: number;
        confidence: number;
    }>;
    bars: Array<{
        start: number;
        duration: number;
        confidence: number;
    }>;
    sections: Array<{
        start: number;
        duration: number;
        loudness: number;
        tempo: number;
    }>;
}

export interface SpotifyPlayerState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
        current_track: {
            id: string;
            name: string;
            artists: Array<{ name: string }>;
            album: {
                name: string;
                images: Array<{ url: string }>;
            };
            duration_ms: number;
            uri: string;
        };
    };
}

export interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
    images: Array<{
        url: string;
    }>;
    product: string; // 'premium' | 'free'
}

// Web Playback SDK Types
export interface SpotifyPlayer {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (data: any) => void): void;
    removeListener(event: string, callback?: (data: any) => void): void;
    getCurrentState(): Promise<SpotifyPlayerState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    activateElement(): Promise<void>;
}

// Unified Player Types
export type PlayerSource = 'local' | 'spotify';

export interface UnifiedTrack {
    id: string;
    name: string;
    artist: string;
    duration: number;
    source: PlayerSource;
    // For local tracks
    url?: string;
    waveformUrl?: string;
    // For Spotify tracks
    spotifyUri?: string;
    albumArt?: string;
    spotifyId?: string;
}

export interface PlayerState {
    currentTrack: UnifiedTrack | null;
    isPlaying: boolean;
    volume: number;
    duration: number;
    seek: number;
    source: PlayerSource;
}
