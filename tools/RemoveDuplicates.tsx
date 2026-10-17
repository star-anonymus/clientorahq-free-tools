"use client";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { CopyButton, Seg } from "@/components/ui/kit";
import { downloadText } from "@/lib/files";

type Sort = "keep" | "az" | "za";

export default function RemoveDuplicates() {
  const [text, setText] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trim, setTrim] = useState(true);
  const [dropEmpty, setDropEmpty] = useState(true);
  const [sort, setSort] = useState<Sort>("keep");

  const r = useMemo(() => {
    const lines = text.split(/\r?\n/);
    const seen = new Set<string>();
    const out: string[] = [];
    let empty = 0;
    for (const raw of lines) {
      const line = trim ? raw.trim() : raw;
      if (!line.trim()) { if (dropEmpty) { empty++; continue; } out.push(line); continue; }
      const key = ignoreCase ? line.toLowerCase() : line;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(line);
    }
    if (sort !== "keep") {
      out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
      if (sort === "za") out.reverse();
    }
    const total = text ? lines.length : 0;
    return { out: out.join("\n"), total, kept: out.length, removed: Math.max(0, total - out.length - empty), empty };
  }, [text, ignoreCase, trim, dropEmpty, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-bg/40 p-4 text-[14.5px]">
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="check" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} /> Ignore case</label>
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="check" checked={trim} onChange={(e) => setTrim(e.target.checked)} /> Trim spaces</label>
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="check" checked={dropEmpty} onChange={(e) => setDropEmpty(e.target.checked)} /> Remove empty lines</label>
        <Seg label="Sort" value={sort} onChange={setSort} options={[{ value: "keep", label: "Keep order" }, { value: "az", label: "A → Z" }, { value: "za", label: "Z → A" }]} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="in">Your list</label>
          <textarea id="in" value={text} onChange={(e) => setText(e.target.value)} placeholder={"one item per line\nlike this\none item per line"} className="input min-h-[340px] font-mono !text-[14px]" autoFocus />
        </div>
        <div>
          <label className="field-label" htmlFor="out">Unique lines</label>
          <textarea id="out" value={r.out} readOnly className="input min-h-[340px] font-mono !text-[14px]" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-[14.5px] text-fg-2" aria-live="polite">
          {r.total ? <><b className="text-fg">{r.removed}</b> duplicate{r.removed === 1 ? "" : "s"} removed{r.empty ? `, ${r.empty} empty` : ""} · <b className="text-fg">{r.kept}</b> lines left</> : "Paste a list to start."}
        </p>
        <CopyButton text={r.out} label="Copy result" className="btn btn-primary" />
        <button type="button" className="btn btn-ghost" disabled={!r.out} onClick={() => downloadText(r.out, "unique-lines.txt")}><Download size={16} /> .txt</button>
      </div>
    </div>
  );
}
