"use client";
import { useRef, useState } from "react";
import { Upload, ShieldCheck } from "lucide-react";
import { toast } from "@/lib/toast";

interface Props {
  /** input accept string, e.g. "application/pdf,.pdf" */
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  /** Big button label, e.g. "Select PDF files" */
  label: string;
  hint?: string;
  /** Test each file; return false to reject it. */
  filter?: (f: File) => boolean;
  compact?: boolean;
  color?: string;
}

/** iLovePDF-style big drop target: one obvious button, drag-and-drop as a bonus. */
export default function DropZone({ accept, multiple = true, onFiles, label, hint, filter, compact, color = "#29e6ff" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (list: FileList | null) => {
    if (!list?.length) return;
    let files = Array.from(list);
    if (filter) {
      const ok = files.filter(filter);
      if (ok.length < files.length) toast.error(`${files.length - ok.length} file(s) skipped — wrong type.`);
      files = ok;
    }
    if (!multiple) files = files.slice(0, 1);
    if (files.length) onFiles(files);
  };

  if (compact) {
    return (
      <>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()}>
          <Upload size={16} /> {label}
        </button>
        <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
      </>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      className={`relative flex flex-col items-center justify-center gap-4 rounded-[18px] border-2 border-dashed px-5 py-12 text-center transition-colors sm:py-16 ${
        over ? "border-cyan bg-cyan/10" : "border-line-hi bg-bg/40"
      }`}
    >
      <span className="grid h-16 w-16 place-items-center rounded-2xl border" style={{ color, borderColor: `${color}55`, background: `${color}14` }}>
        <Upload size={28} aria-hidden="true" />
      </span>
      <button type="button" className="btn btn-primary btn-lg w-full max-w-xs" onClick={() => input.current?.click()}>
        {label}
      </button>
      <p className="text-[14.5px] text-fg-2">or drop {multiple ? "files" : "a file"} here{hint ? ` · ${hint}` : ""}</p>
      <p className="flex items-center gap-1.5 text-[13px] text-fg-3">
        <ShieldCheck size={15} className="text-ok" aria-hidden="true" /> Processed on your device — nothing is uploaded
      </p>
      <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
    </div>
  );
}
