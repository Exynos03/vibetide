"use client";

import React, { useState } from 'react';
import { SpotifyTrack } from '@/types/spotify';

interface TrackBrowserProps {
    onTrackSelect: (uri: string, track: any) => void;
}

export default function TrackBrowser({ onTrackSelect }: TrackBrowserProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.tracks);
            }
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 rounded-full hover:bg-white/10 hover:text-white transition-all duration-300 text-sm"
            >
                Browse Spotify
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-light text-white">Browse Spotify</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search for lofi tracks..."
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600/80 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto space-y-2">
                    {searchResults.map((track) => (
                        <div
                            key={track.id}
                            onClick={() => {
                                onTrackSelect(track.uri, {
                                    id: track.id,
                                    name: track.name,
                                    artist: track.artists.map(a => a.name).join(', '),
                                    duration: track.duration_ms / 1000,
                                    source: 'spotify',
                                    spotifyUri: track.uri,
                                    albumArt: track.album.images[0]?.url,
                                    spotifyId: track.id,
                                });
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors group"
                        >
                            {track.album.images[0] && (
                                <img
                                    src={track.album.images[0].url}
                                    alt={track.album.name}
                                    className="w-12 h-12 rounded"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{track.name}</div>
                                <div className="text-white/60 text-sm truncate">
                                    {track.artists.map(a => a.name).join(', ')}
                                </div>
                            </div>
                            <div className="text-white/40 group-hover:text-white/60 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
