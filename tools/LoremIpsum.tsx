"use client";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CopyButton, Seg } from "@/components/ui/kit";

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis et commodo pharetra eros bibendum elit nec luctus magna felis sollicitudin mauris integer dapibus".split(" ");
const START = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";

type Unit = "paragraphs" | "sentences" | "words";

function rnd(n: number) { return Math.floor(Math.random() * n); }
function sentence() {
  const n = 8 + rnd(10);
  const w = Array.from({ length: n }, () => WORDS[rnd(WORDS.length)]);
  if (n > 10) w[4 + rnd(4)] += ",";
  const s = w.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
function paragraph() { return Array.from({ length: 4 + rnd(4) }, sentence).join(" "); }

export default function LoremIpsum() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [html, setHtml] = useState(false);
  const [seed, setSeed] = useState(0);

  const parts = useMemo(() => {
    void seed; // re-roll on demand
    const n = Math.max(1, Math.min(unit === "words" ? 2000 : 100, count || 1));
    let list: string[];
    if (unit === "words") list = [Array.from({ length: n }, () => WORDS[rnd(WORDS.length)]).join(" ")];
    else if (unit === "sentences") list = [Array.from({ length: n }, sentence).join(" ")];
    else list = Array.from({ length: n }, paragraph);
    if (classic) {
      if (unit === "words") list[0] = START.replace(",", "").split(" ").concat(list[0].split(" ")).slice(0, n).join(" ");
      else list[0] = `${START}. ${list[0].split(". ").slice(1).join(". ") || list[0]}`;
    }
    return list;
  }, [unit, count, classic, seed]);

  const output = html ? parts.map((p) => `<p>${p}</p>`).join("\n") : parts.join("\n\n");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-bg/40 p-4">
        <div className="w-28">
          <label className="field-label" htmlFor="n">How many</label>
          <input id="n" type="number" min={1} max={unit === "words" ? 2000 : 100} value={count} onChange={(e) => setCount(+e.target.value)} className="input" />
        </div>
        <Seg label="Unit" value={unit} onChange={setUnit} options={[{ value: "paragraphs", label: "Paragraphs" }, { value: "sentences", label: "Sentences" }, { value: "words", label: "Words" }]} />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[14.5px]"><input type="checkbox" className="check" checked={classic} onChange={(e) => setClassic(e.target.checked)} /> Start with “Lorem ipsum…”</label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[14.5px]"><input type="checkbox" className="check" checked={html} onChange={(e) => setHtml(e.target.checked)} /> HTML &lt;p&gt; tags</label>
      </div>
      <label htmlFor="lo" className="sr-only">Generated text</label>
      <textarea id="lo" readOnly value={output} className={`input min-h-[320px] ${html ? "font-mono !text-[14px]" : ""}`} />
      <div className="flex flex-wrap gap-2">
        <CopyButton text={output} label="Copy text" className="btn btn-primary" />
        <button type="button" className="btn btn-ghost" onClick={() => setSeed((s) => s + 1)}><RefreshCw size={16} /> Generate again</button>
      </div>
    </div>
  );
}
