"use client";

import React from 'react'
import Waveform from '@/components/Waveform'
import SpotifyWaveform from '@/components/SpotifyWaveform'
import { useUnifiedPlayer } from '@/hooks/useUnifiedPlayer'
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background'
import KoiFish from '@/components/bgWrappers/KoiFish'
import LiveClock from '@/components/LiveClock'
import SpotifyAuth from '@/components/SpotifyAuth'
import SourceSelector from '@/components/SourceSelector'
import TrackBrowser from '@/components/TrackBrowser'

const Home = () => {
  const tracks = [
    "audio/coffee-lofi-chill-lofi-music-332738.mp3",
    "audio/good-night-lofi-cozy-chill-music-160166.mp3",
    "audio/lofi-girl-lofi-hiphop-beats-328177.mp3",
    "audio/lofi-rain-lofi-music-332732.mp3",
    "audio/ocean-lofi-vibes-lofi-music-340023.mp3",
    "audio/whispering-vinyl-loops-lofi-beats-281193.mp3",
  ]

  const {
    source,
    isPlaying,
    duration,
    seek,
    currentTrack,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    switchSource,
    playSpotifyTrack,
    spotifyReady,
    localCurrentTrackIndex,
  } = useUnifiedPlayer(tracks)

  const waveformUrl =
    "/output-audio/" +
    tracks[localCurrentTrackIndex]
      .split("/")
      .pop()!
      .replace(/\.(mp3|wav|m4a)$/i, ".json")

  return (
    <KoiFish>
      {/* Content - centered in the middle of the screen */}
      <div className='absolute inset-0 flex flex-col gap-8 justify-center items-center z-20'>

        {/* Top Bar - Auth and Source Selector */}
        <div className="flex items-center gap-4">
          <SpotifyAuth />
          <SourceSelector
            currentSource={source}
            onSourceChange={switchSource}
            spotifyReady={spotifyReady}
          />
          {source === 'spotify' && spotifyReady && (
            <TrackBrowser onTrackSelect={playSpotifyTrack} />
          )}
        </div>

        {/* Live Clock */}
        <LiveClock />

        {/* Track Info */}
        {currentTrack && (
          <div className="text-center">
            <div className="text-white/90 text-xl font-light">{currentTrack.name}</div>
            <div className="text-white/60 text-sm">{currentTrack.artist}</div>
          </div>
        )}

        {/* Waveform Container with Glow */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {source === 'local' ? (
            <Waveform
              dataUrl={waveformUrl}
              progress={duration ? seek / duration : 0}
              onSeek={(p) => handleSeek(p * duration)}
              width={1000}
              height={200}
              barWidth={5}
              barGap={8}
              color="rgba(255, 255, 255, 0.5)"
              progressColor="rgba(255, 255, 255, 0.95)"
            />
          ) : currentTrack?.spotifyId ? (
            <SpotifyWaveform
              trackId={currentTrack.spotifyId}
              progress={duration ? seek / duration : 0}
              onSeek={(p) => handleSeek(p * duration)}
              width={1000}
              height={200}
              barWidth={5}
              barGap={8}
              color="rgba(255, 255, 255, 0.5)"
              progressColor="rgba(255, 255, 255, 0.95)"
            />
          ) : (
            <div className="w-[1000px] h-[200px] flex items-center justify-center text-white/40">
              Select a track to play
            </div>
          )}
        </div>

        {/* Controls Container */}
        <div className="flex items-center gap-8">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="p-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:scale-110 transition-all duration-300"
            aria-label="Previous Track"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 19V5l-11 7 11 7zm11 0V5l-11 7 11 7z" />
            </svg>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className='group relative px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]'
          >
            <div className="flex items-center gap-3 font-light tracking-widest text-sm uppercase">
              {isPlaying ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-white/50 rounded-full group-hover:bg-white transition-colors" />
                  <span>Play</span>
                </>
              )}
            </div>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="p-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:scale-110 transition-all duration-300"
            aria-label="Next Track"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 5v14l11-7-11-7zm11 0v14l11-7-11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </KoiFish>
  )
}

export default Home