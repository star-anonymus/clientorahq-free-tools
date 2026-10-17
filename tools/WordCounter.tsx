"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { CopyButton } from "@/components/ui/kit";

const STOP = new Set("a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those i you he she we they me my your our their his her them us not no do does did so than then there here what which who whom will would can could should shall may might must have has had just about into over also more most very".split(" "));

const LIMITS = [
  { name: "Title tag", max: 60 },
  { name: "Meta description", max: 160 },
  { name: "X (Twitter) post", max: 280 },
  { name: "LinkedIn connection note", max: 300 },
  { name: "Instagram caption", max: 2200 },
  { name: "LinkedIn post", max: 3000 },
];

function fmtTime(minutes: number) {
  if (minutes < 1) return `${Math.max(0, Math.round(minutes * 60))} sec`;
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s ? `${m} min ${s} sec` : `${m} min`;
}

export default function WordCounter() {
  const [text, setText] = useState("");
  const t = useDeferredValue(text);

  const s = useMemo(() => {
    const words = t.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
    const sentences = t.split(/[.!?…]+(?:\s|$)/).filter((x) => x.trim()).length;
    const paragraphs = t.split(/\n\s*\n/).filter((x) => x.trim()).length;
    const freq = new Map<string, number>();
    for (const w of words) {
      const k = w.toLowerCase();
      if (k.length < 3 || STOP.has(k) || /^\d+$/.test(k)) continue;
      freq.set(k, (freq.get(k) ?? 0) + 1);
    }
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      words: words.length,
      chars: [...t].length,
      noSpace: [...t.replace(/\s/g, "")].length,
      sentences,
      paragraphs,
      read: words.length / 238,
      speak: words.length / 140,
      top,
    };
  }, [t]);

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_320px]">
      <div>
        <label htmlFor="wc" className="sr-only">Your text</label>
        <textarea
          id="wc"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing, or paste your text here…"
          className="input min-h-[360px] text-[16px]"
          autoFocus
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={text} />
          <button type="button" className="btn btn-ghost btn-sm" disabled={!text} onClick={() => setText("")}><Trash2 size={15} /> Clear</button>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-2" aria-live="polite">
          <div className="stat col-span-2"><b className="!text-[38px] text-cyan">{s.words.toLocaleString()}</b><span>words</span></div>
          <div className="stat"><b>{s.chars.toLocaleString()}</b><span>characters</span></div>
          <div className="stat"><b>{s.noSpace.toLocaleString()}</b><span>no spaces</span></div>
          <div className="stat"><b>{s.sentences}</b><span>sentences</span></div>
          <div className="stat"><b>{s.paragraphs}</b><span>paragraphs</span></div>
          <div className="stat"><b className="!text-[18px]">{fmtTime(s.read)}</b><span>reading time</span></div>
          <div className="stat"><b className="!text-[18px]">{fmtTime(s.speak)}</b><span>speaking time</span></div>
        </div>
        <div className="rounded-2xl border border-line bg-bg/40 p-4">
          <p className="field-label">Length limits</p>
          <ul className="space-y-2.5">
            {LIMITS.map((l) => {
              const pct = Math.min(100, (s.chars / l.max) * 100);
              const over = s.chars > l.max;
              return (
                <li key={l.name}>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-fg-2">{l.name}</span>
                    <span className={over ? "font-semibold text-bad" : "text-fg-3"}>{s.chars}/{l.max}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cyan/10">
                    <div className={`h-full rounded-full ${over ? "bg-bad" : pct > 85 ? "bg-warn" : "bg-cyan"}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {s.top.length > 0 && (
          <div className="rounded-2xl border border-line bg-bg/40 p-4">
            <p className="field-label">Top keywords</p>
            <ul className="space-y-1 text-[14px]">
              {s.top.map(([w, n]) => (
                <li key={w} className="flex justify-between">
                  <span className="text-fg">{w}</span>
                  <span className="font-mono text-fg-3">{n} · {((n / s.words) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
