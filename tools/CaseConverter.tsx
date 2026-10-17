"use client";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/ui/kit";
import { downloadText } from "@/lib/files";

const SMALL = new Set("a an and as at but by en for if in nor of on or per the to v vs via".split(" "));

const words = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

const CASES: { id: string; label: string; fn: (s: string) => string }[] = [
  {
    id: "sentence",
    label: "Sentence case",
    fn: (s) => s.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (m) => m.toUpperCase()).replace(/\bi\b/g, "I"),
  },
  { id: "lower", label: "lower case", fn: (s) => s.toLowerCase() },
  { id: "upper", label: "UPPER CASE", fn: (s) => s.toUpperCase() },
  {
    id: "title",
    label: "Title Case",
    fn: (s) =>
      s.split("\n").map((line) => {
        const parts = line.toLowerCase().split(/(\s+)/);
        const idx = parts.map((p, i) => (p.trim() ? i : -1)).filter((i) => i >= 0);
        // Small words stay lower, except first, last and right after : . ! ?
        return parts.map((p, i) => {
          if (!p.trim()) return p;
          const prev = parts[i - 2] ?? "";
          const force = i === idx[0] || i === idx[idx.length - 1] || /[:.!?]$/.test(prev);
          return force || !SMALL.has(p.replace(/[^\p{L}]/gu, "")) ? p.replace(/\p{L}/u, (c) => c.toUpperCase()) : p;
        }).join("");
      }).join("\n"),
  },
  { id: "capital", label: "Capitalize Each Word", fn: (s) => s.toLowerCase().replace(/(^|[\s(\-"'])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) },
  { id: "alt", label: "aLtErNaTiNg", fn: (s) => { let i = 0; return [...s].map((c) => (/\p{L}/u.test(c) ? (i++ % 2 ? c.toUpperCase() : c.toLowerCase()) : c)).join(""); } },
  { id: "camel", label: "camelCase", fn: (s) => s.split("\n").map((l) => words(l).map((w, i) => (i ? cap(w) : w.toLowerCase())).join("")).join("\n") },
  { id: "pascal", label: "PascalCase", fn: (s) => s.split("\n").map((l) => words(l).map(cap).join("")).join("\n") },
  { id: "snake", label: "snake_case", fn: (s) => s.split("\n").map((l) => words(l).map((w) => w.toLowerCase()).join("_")).join("\n") },
  { id: "kebab", label: "kebab-case", fn: (s) => s.split("\n").map((l) => words(l).map((w) => w.toLowerCase()).join("-")).join("\n") },
  { id: "constant", label: "CONSTANT_CASE", fn: (s) => s.split("\n").map((l) => words(l).map((w) => w.toUpperCase()).join("_")).join("\n") },
];

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Convert to">
        {CASES.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={!text}
            aria-pressed={last === c.id}
            onClick={() => { setText(c.fn(text)); setLast(c.id); }}
            className={`btn btn-sm ${last === c.id ? "btn-primary" : "btn-ghost"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <label htmlFor="cc" className="sr-only">Text to convert</label>
      <textarea id="cc" value={text} onChange={(e) => { setText(e.target.value); setLast(null); }} placeholder="Paste or type your text, then pick a case above…" className="input min-h-[320px] text-[16px]" autoFocus />
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={text} className="btn btn-primary" />
        <button type="button" className="btn btn-ghost" disabled={!text} onClick={() => downloadText(text, "converted-text.txt")}><Download size={16} /> Download .txt</button>
        <button type="button" className="btn btn-ghost" disabled={!text} onClick={() => { setText(""); setLast(null); }}><Trash2 size={16} /> Clear</button>
        <span className="ml-auto text-[13px] text-fg-3">{[...text].length.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
