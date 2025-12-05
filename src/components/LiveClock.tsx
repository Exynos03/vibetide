"use client";

import React, { useState, useEffect } from 'react';

const LiveClock = () => {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!time) return null; // Avoid hydration mismatch

    return (
        <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative group">
                <div className="absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <h1 className="relative text-6xl md:text-8xl font-thin tracking-widest text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] select-none font-[family-name:var(--font-geist-mono)]">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-2xl md:text-3xl ml-4 font-light text-white/60">
                        {time.toLocaleTimeString([], { second: '2-digit' }).split(' ')[0].slice(-2)}
                    </span>
                </h1>
                <div className="text-center mt-2 text-white/40 text-sm tracking-[0.5em] uppercase font-light">
                    {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>
        </div>
    );
};

export default LiveClock;
