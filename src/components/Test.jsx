"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Retro capsule waveform renderer with textured background.
 */
const Waveform = ({
  jsonUrl,
  height = 180,
  barWidth = 14,
  barGap = 8,
  background = "#9ba474",
  barColor = "#0a0a0a",
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [samples, setSamples] = useState([]);
  const [bits, setBits] = useState(8);

  useEffect(() => {
    if (!jsonUrl) return;
    const url = jsonUrl.startsWith("/") ? jsonUrl : `/${jsonUrl}`;
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const arr = Array.isArray(data?.data) ? data.data : [];
        setSamples(arr);
        setBits(typeof data?.bits === "number" ? data.bits : 8);
      })
      .catch(() => {
        if (!cancelled) {
          setSamples([]);
          setBits(8);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [jsonUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bars = useMemo(() => {
    if (!samples.length || !containerWidth) return [];
    const maxBars = Math.max(1, Math.floor(containerWidth / (barWidth + barGap)));
    const bucketSize = Math.max(1, Math.floor(samples.length / maxBars));
    const maxAbs = bits === 16 ? 32768 : 128;
    const result = [];
    for (let i = 0; i < maxBars; i++) {
      const start = i * bucketSize;
      const end = Math.min(samples.length, start + bucketSize);
      let sum = 0;
      for (let j = start; j < end; j++) sum += Math.abs(samples[j]);
      const avg = sum / Math.max(1, end - start);
      result.push(Math.min(1, avg / maxAbs));
    }
    return result;
  }, [samples, containerWidth, barWidth, barGap, bits]);

  const minCapsule = Math.max(8, barWidth);
  const maxCapsule = Math.max(minCapsule + 8, height * 0.7);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: background,
        backgroundImage:
          "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1.2px), radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1.2px), radial-gradient(ellipse at center, rgba(0,0,0,0.55), transparent 60%)",
        backgroundSize: "3px 3px, 4px 4px, 100% 100%",
        backgroundPosition: "0 0, 1px 1px, center",
      }}
    >
      <div className="relative w-[92%] max-w-[1200px]">
        <svg
          role="img"
          aria-label="Waveform"
          width="100%"
          height={height}
          viewBox={`0 0 ${Math.max(1, containerWidth)} ${height}`}
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            x2={containerWidth}
            y1={height / 2}
            y2={height / 2}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1"
          />
          {bars.map((p, i) => {
            const w = barWidth;
            const x = i * (barWidth + barGap) + (containerWidth - bars.length * (barWidth + barGap) + barGap) / 2;
            const h = Math.max(minCapsule, Math.min(maxCapsule, p * maxCapsule));
            const y = height / 2 - h / 2;
            const rx = Math.min(w / 2, 9999);
            return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} fill={barColor} />;
          })}
        </svg>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))" }}
      />
    </div>
  );
};

export default Waveform;
