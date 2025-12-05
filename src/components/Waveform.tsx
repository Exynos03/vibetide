"use client";

import { useEffect, useRef, useState } from "react";
import WaveformData from "waveform-data";

type Props = {
  dataUrl: string; // e.g. /waveforms/track.json
  progress: number; // 0..1
  onSeek?: (percent: number) => void;
  width?: number;
  height?: number;
  color?: string;
  progressColor?: string;
  barWidth?: number;
  barGap?: number;
};

type WaveformInstance = {
  channels: number;
  length: number;
  resample: (opts: { width: number }) => WaveformInstance;
  channel: (
    index: number
  ) => {
    min_array: () => number[];
    max_array: () => number[];
    min_sample: (i: number) => number;
    max_sample: (i: number) => number;
  };
};

export default function Waveform({
  dataUrl,
  progress,
  onSeek,
  width = 300,
  height = 80,
  color = "#1e1e1e",
  progressColor = "#0f0f0f",
  barWidth = 6,
  barGap = 8,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wf, setWf] = useState<WaveformInstance | null>(null);
  const [bits, setBits] = useState<number>(8);

  useEffect(() => {
    let cancelled = false;
    const url = dataUrl.startsWith("/") ? dataUrl : `/${dataUrl}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
        return r.json();
      })
      .then((json) => {
        try {
          const waveform = WaveformData.create(json) as unknown as WaveformInstance;
          if (!cancelled) {
            setWf(waveform);
            const b = (json as any)?.bits;
            setBits(typeof b === "number" ? b : 8);
          }
        } catch (e) {
          console.error("Waveform parse error:", e);
          if (!cancelled) setWf(null);
        }
      })
      .catch((err) => {
        console.error("Waveform fetch error:", err);
        setWf(null);
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !wf) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    el.width = Math.floor(width * dpr);
    el.height = Math.floor(height * dpr);
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;

    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Calculate number of bars that fit
    const totalBarWidth = barWidth + barGap;
    const numBars = Math.floor(width / totalBarWidth);

    // Resample to the number of bars
    const resampled = wf.resample({ width: numBars });
    const channel = resampled.channel(0);

    // We want to draw symmetric bars around the center
    const centerY = height / 2;

    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    };

    // Helper to draw a set of bars
    const drawBars = (clipWidth: number, fill: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, clipWidth, height);
      ctx.clip();

      ctx.fillStyle = fill;

      for (let i = 0; i < numBars; i++) {
        const val = channel.max_sample(i);

        // Normalize based on bit depth
        const range = bits === 16 ? 32768 : 128;
        const normalized = Math.abs(val) / range;

        // Scale height. Min height = barWidth (so it's a circle/square at silence)
        const barHeight = Math.max(barWidth, normalized * height);

        const x = i * totalBarWidth;
        const y = centerY - barHeight / 2;

        drawRoundedRect(ctx, x, y, barWidth, barHeight, barWidth / 2);
      }

      ctx.restore();
    };

    drawBars(width, color);
    drawBars(Math.max(0, Math.min(1, progress)) * width, progressColor);
  }, [wf, bits, progress, width, height, color, progressColor, barWidth, barGap]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, p)));
  };

  return <canvas ref={canvasRef} onClick={handleClick} />;
}


