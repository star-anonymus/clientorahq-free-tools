"use client";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { CopyButton } from "@/components/ui/kit";
import { downloadText } from "@/lib/files";

const RULES = [
  { id: "join", label: "Join broken lines (PDF copy)", on: true, fn: (s: string) => s.replace(/([^\n])\n(?!\n)(?=\S)/g, (_, a) => (a === "-" ? "" : `${a} `)) },
  { id: "spaces", label: "Collapse double spaces", on: true, fn: (s: string) => s.replace(/[  ]{2,}/g, " ") },
  { id: "tabs", label: "Tabs to spaces", on: true, fn: (s: string) => s.replace(/\t+/g, " ") },
  { id: "trim", label: "Trim each line", on: true, fn: (s: string) => s.split("\n").map((l) => l.trim()).join("\n") },
  { id: "blank", label: "Max one empty line", on: true, fn: (s: string) => s.replace(/\n{3,}/g, "\n\n") },
  { id: "noblank", label: "Remove all empty lines", on: false, fn: (s: string) => s.replace(/\n\s*\n/g, "\n") },
  { id: "quotes", label: "Straighten smart quotes", on: false, fn: (s: string) => s.replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"') },
  { id: "dashes", label: "Long dashes to hyphens", on: false, fn: (s: string) => s.replace(/[–—]/g, "-") },
  { id: "zw", label: "Remove invisible characters", on: true, fn: (s: string) => s.replace(/[​-‍﻿­]/g, "") },
  { id: "oneline", label: "Make it one line", on: false, fn: (s: string) => s.replace(/\s*\n\s*/g, " ") },
];

export default function TextCleaner() {
  const [text, setText] = useState("");
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(RULES.map((r) => [r.id, r.on])));

  const out = useMemo(() => RULES.reduce((s, r) => (on[r.id] ? r.fn(s) : s), text.replace(/\r\n?/g, "\n")).trim(), [text, on]);
  const saved = text.length - out.length;

  return (
    <div className="space-y-4">
      <fieldset className="grid gap-x-5 gap-y-2.5 rounded-2xl border border-line bg-bg/40 p-4 text-[14.5px] sm:grid-cols-2 lg:grid-cols-3">
        <legend className="sr-only">Clean-ups</legend>
        {RULES.map((r) => (
          <label key={r.id} className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="check" checked={on[r.id]} onChange={(e) => setOn((p) => ({ ...p, [r.id]: e.target.checked }))} /> {r.label}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="tin">Messy text</label>
          <textarea id="tin" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text copied from a PDF, email or website…" className="input min-h-[340px]" autoFocus />
        </div>
        <div>
          <label className="field-label" htmlFor="tout">Clean text</label>
          <textarea id="tout" value={out} readOnly className="input min-h-[340px]" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-[14.5px] text-fg-2" aria-live="polite">{text ? <><b className="text-fg">{saved.toLocaleString()}</b> characters removed</> : "Paste text to start."}</p>
        <CopyButton text={out} label="Copy clean text" className="btn btn-primary" />
        <button type="button" className="btn btn-ghost" disabled={!out} onClick={() => downloadText(out, "clean-text.txt")}><Download size={16} /> .txt</button>
      </div>
    </div>
  );
}
