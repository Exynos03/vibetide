"use client";

import React from 'react'
import Waveform from '@/components/Waveform'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background'
import KoiFish from '@/components/bgWrappers/KoiFish'


import LiveClock from '@/components/LiveClock'

const Home = () => {
  const tracks = [
    "audio/coffee-lofi-chill-lofi-music-332738.mp3",
    "audio/good-night-lofi-cozy-chill-music-160166.mp3",
    "audio/lofi-girl-lofi-hiphop-beats-328177.mp3",
    "audio/lofi-rain-lofi-music-332732.mp3",
    "audio/ocean-lofi-vibes-lofi-music-340023.mp3",
    "audio/whispering-vinyl-loops-lofi-beats-281193.mp3",
  ]

  const { currentTrack, seek, duration, handleSeek, handlePlayPause, isPlaying, handleNext, handlePrev } = useAudioPlayer(tracks)

  const waveformUrl =
    "/output-audio/" +
    tracks[currentTrack]
      .split("/")
      .pop()!
      .replace(/\.(mp3|wav|m4a)$/i, ".json")

  console.log(waveformUrl)

  return (

    <KoiFish>
      {/* Dotted Glow Background - behind everything but inside the wrapper if needed, 
          though KoiFish has its own bg. We can keep this for extra effect or remove it.
          Let's keep it but make it subtle as per original code if it was intended to layer.
          However, the user asked to use KoiFish bg. 
          I will re-enable the content structure inside KoiFish. 
      */}

      {/* Content - centered in the middle of the screen */}
      <div className='absolute inset-0 flex flex-col gap-12 justify-center items-center z-20'>

        {/* Live Clock */}
        <LiveClock />

        {/* Waveform Container with Glow */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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