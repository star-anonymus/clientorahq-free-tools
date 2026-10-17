"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { openPdf, renderPage } from "@/lib/pdf";

/** Thumbnails for every page of a PDF, rendered one by one so big files stay responsive. */
export function usePdfThumbs(file: File | null, width = 150) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!file) return;
    let live = true;
    setThumbs([]);
    setCount(0);
    setError(false);
    (async () => {
      try {
        const doc = await openPdf(await file.arrayBuffer());
        if (!live) return;
        setCount(doc.numPages);
        for (let p = 1; p <= doc.numPages && live; p++) {
          const c = await renderPage(doc, p, { width });
          const url = c.toDataURL("image/jpeg", 0.72);
          if (live) setThumbs((t) => { const n = t.slice(); n[p - 1] = url; return n; });
        }
        await doc.loadingTask.destroy();
      } catch {
        if (live) setError(true);
      }
    })();
    return () => { live = false; };
  }, [file, width]);

  return { thumbs, count, error };
}

export default function PageGrid({ count, thumbs, selected, onToggle, rotation, badge }: {
  count: number;
  thumbs: string[];
  selected?: Set<number>;
  onToggle?: (page: number) => void;
  /** degrees per 0-based page index */
  rotation?: Record<number, number>;
  badge?: (page: number) => React.ReactNode;
}) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => {
        const on = selected?.has(i);
        const rot = rotation?.[i] ?? 0;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onToggle?.(i)}
              aria-pressed={selected ? on : undefined}
              aria-label={`Page ${i + 1}${selected ? (on ? ", selected" : "") : ""}`}
              className={`group relative flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-colors ${on ? "border-cyan bg-cyan/10" : "border-line bg-bg/40 hover:border-line-hi"}`}
            >
              <span className="grid aspect-[3/4] w-full place-items-center overflow-hidden">
                {thumbs[i]
                  ? <img src={thumbs[i]} alt="" className="max-h-full max-w-full bg-white shadow transition-transform duration-200" style={{ transform: `rotate(${rot}deg)` }} />
                  : <span className="h-full w-full animate-pulse rounded bg-cyan/10" />}
              </span>
              <span className="text-[12.5px] font-semibold text-fg-2">{i + 1}</span>
              {on && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-cyan text-ink"><Check size={15} strokeWidth={3} /></span>}
              {badge?.(i)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** "1-3, 5, 9-" → zero-based page indexes (deduped, in order). Returns null if malformed. */
export function parseRanges(input: string, count: number): number[][] | null {
  const groups: number[][] = [];
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(part);
    if (!m || (!m[1] && !m[3])) return null;
    const a = m[1] ? +m[1] : 1;
    const b = m[2] ? (m[3] ? +m[3] : count) : a;
    if (a < 1 || b < a || a > count) return null;
    groups.push(Array.from({ length: Math.min(b, count) - a + 1 }, (_, i) => a - 1 + i));
  }
  return groups;
}

export function toRanges(pages: number[]) {
  const s = [...pages].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(i === j ? `${s[i] + 1}` : `${s[i] + 1}-${s[j] + 1}`);
    i = j;
  }
  return out.join(", ");
}
