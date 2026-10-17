"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Copy, Check, FileText, RotateCcw, X } from "lucide-react";
import { copyText } from "@/lib/files";
import { toast } from "@/lib/toast";

/** One row in a file queue: thumb, name, meta, reorder + remove — never drag-only. */
export function FileRow({
  thumb, name, meta, index, count, onMove, onRemove, status,
}: {
  /** undefined = still loading, null = no preview */
  thumb?: string | null;
  name: string;
  meta?: React.ReactNode;
  index: number;
  count: number;
  onMove?: (from: number, to: number) => void;
  onRemove?: () => void;
  status?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 p-2.5 pr-2">
      <span className="grid h-14 w-12 flex-none place-items-center overflow-hidden rounded-lg border border-line bg-white/5">
        {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : thumb === null ? <FileText size={20} className="text-fg-3" aria-hidden="true" /> : <span className="h-5 w-5 animate-pulse rounded bg-cyan/20" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-fg" title={name}>{name}</p>
        <div className="text-[13px] text-fg-3">{meta}</div>
      </div>
      {status}
      {onMove && count > 1 && (
        <div className="flex flex-none flex-col sm:flex-row">
          <IconBtn label={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}><ArrowUp size={16} /></IconBtn>
          <IconBtn label={`Move ${name} down`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}><ArrowDown size={16} /></IconBtn>
        </div>
      )}
      {onRemove && <IconBtn label={`Remove ${name}`} onClick={onRemove}><X size={17} /></IconBtn>}
    </li>
  );
}

export function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg text-fg-3 transition-colors hover:bg-cyan/10 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** "Done" state shown after a job, iLovePDF-style: big download, then start over. */
export function ResultPanel({ title, detail, onDownload, downloadLabel, onReset, children }: {
  title: string;
  detail?: React.ReactNode;
  onDownload?: () => void;
  downloadLabel?: string;
  onReset: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[18px] border border-ok/30 bg-ok/[0.06] px-5 py-10 text-center">
      <CheckCircle2 size={44} className="text-ok" aria-hidden="true" />
      <div>
        <p className="text-[22px] font-bold">{title}</p>
        {detail && <p className="mt-1 text-[15px] text-fg-2">{detail}</p>}
      </div>
      {onDownload && (
        <button type="button" className="btn btn-primary btn-lg w-full max-w-xs" onClick={onDownload}>
          {downloadLabel ?? "Download"}
        </button>
      )}
      {children}
      <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>
        <RotateCcw size={15} /> Start over
      </button>
    </div>
  );
}

export function CopyButton({ text, label = "Copy", className = "btn btn-ghost btn-sm" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={!text}
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } else toast.error("Copy failed — select the text and press Ctrl+C.");
      }}
    >
      {done ? <Check size={16} /> : <Copy size={16} />} {done ? "Copied" : label}
    </button>
  );
}

export function Seg<T extends string | number>({ value, options, onChange, label }: {
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="w-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} aria-label={label ?? "Progress"}>
      <div className="h-2 overflow-hidden rounded-full bg-cyan/10">
        <div className="h-full rounded-full bg-cyan transition-[width] duration-300" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
      {label && <p className="mt-2 text-center text-[13.5px] text-fg-2">{label}</p>}
    </div>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <span className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Field({ label, children, hint, htmlFor }: { label: string; children: React.ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[12.5px] text-fg-3">{hint}</p>}
    </div>
  );
}
