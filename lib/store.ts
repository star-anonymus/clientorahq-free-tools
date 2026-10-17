"use client";
import { useEffect, useState } from "react";

function read<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? initial : (JSON.parse(raw) as T);
  } catch {
    return initial; // private mode, blocked storage or bad JSON
  }
}

/**
 * useState that survives reloads in this browser only (localStorage). Never throws.
 * Tools render client-side only (ssr: false), so reading storage during the first
 * render is safe — and it means a stale default can never overwrite saved data.
 */
export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => (typeof window === "undefined" ? initial : read(key, initial)));

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  }, [key, value]);

  return [value, setValue] as const;
}

/** Short bell made with Web Audio — no sound file to download. */
export function bell(times = 2) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    for (let i = 0; i < times; i++) {
      const t = ctx.currentTime + i * 0.45;
      for (const [freq, gain] of [[880, 0.35], [1320, 0.12]] as const) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + 1.25);
      }
    }
    setTimeout(() => ctx.close(), times * 450 + 1500);
  } catch { /* audio blocked */ }
}
