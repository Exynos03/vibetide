"use client";

import React, { useEffect, useState } from 'react';
import { SpotifyAudioAnalysis } from '@/types/spotify';

interface SpotifyWaveformProps {
    trackId: string;
    progress: number;
    onSeek: (progress: number) => void;
    width?: number;
    height?: number;
    barWidth?: number;
    barGap?: number;
    color?: string;
    progressColor?: string;
}

export default function SpotifyWaveform({
    trackId,
    progress,
    onSeek,
    width = 1000,
    height = 200,
    barWidth = 5,
    barGap = 8,
    color = 'rgba(255, 255, 255, 0.5)',
    progressColor = 'rgba(255, 255, 255, 0.95)',
}: SpotifyWaveformProps) {
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!trackId) return;

            setLoading(true);
            try {
                const response = await fetch(`/api/spotify/audio-analysis/${trackId}`);
                if (!response.ok) throw new Error('Failed to fetch analysis');

                const analysis: SpotifyAudioAnalysis = await response.json();

                // Convert segments to waveform-like data
                const numBars = Math.floor(width / (barWidth + barGap));
                const segmentData = analysis.segments || [];

                if (segmentData.length === 0) {
                    // Fallback: create generic waveform
                    setWaveformData(Array(numBars).fill(0).map(() => Math.random()));
                    setLoading(false);
                    return;
                }

                // Map segments to bars
                const bars: number[] = [];
                const totalDuration = segmentData[segmentData.length - 1].start +
                    segmentData[segmentData.length - 1].duration;

                for (let i = 0; i < numBars; i++) {
                    const time = (i / numBars) * totalDuration;

                    // Find closest segment
                    const segment = segmentData.find((s, idx) => {
                        const nextStart = segmentData[idx + 1]?.start || totalDuration;
                        return time >= s.start && time < nextStart;
                    });

                    if (segment) {
                        // Normalize loudness to 0-1 range
                        // Spotify loudness is typically -60 to 0 dB
                        const normalized = Math.max(0, Math.min(1, (segment.loudness_max + 60) / 60));
                        bars.push(normalized);
                    } else {
                        bars.push(0.3); // Default value
                    }
                }

                setWaveformData(bars);
            } catch (error) {
                console.error('Error fetching audio analysis:', error);
                // Fallback to generic waveform
                const numBars = Math.floor(width / (barWidth + barGap));
                setWaveformData(Array(numBars).fill(0).map(() => 0.3 + Math.random() * 0.4));
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [trackId, width, barWidth, barGap]);

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickProgress = x / width;
        onSeek(clickProgress);
    };

    if (loading) {
        return (
            <svg width={width} height={height} className="cursor-pointer">
                <text
                    x={width / 2}
                    y={height / 2}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.5)"
                    fontSize="14"
                >
                    Loading waveform...
                </text>
            </svg>
        );
    }

    return (
        <svg
            width={width}
            height={height}
            onClick={handleClick}
            className="cursor-pointer"
        >
            {waveformData.map((amplitude, index) => {
                const x = index * (barWidth + barGap);
                const barHeight = amplitude * height;
                const y = (height - barHeight) / 2;
                const isPast = index / waveformData.length <= progress;

                return (
                    <rect
                        key={index}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={isPast ? progressColor : color}
                        rx={barWidth / 2}
                        className="transition-all duration-150"
                    />
                );
            })}
        </svg>
    );
}
