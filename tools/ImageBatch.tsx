"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Sparkles, AlertCircle } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { FileRow, Seg, Spinner } from "@/components/ui/kit";
import { downloadBlob, formatBytes, nextId, zipFiles } from "@/lib/files";
import { isImage, pngColorsFor, processImage, sameType, type OutType } from "@/lib/image";
import { toast } from "@/lib/toast";

interface Item {
  id: string;
  file: File;
  url: string;
  status: "idle" | "working" | "done" | "error";
  out?: { blob: Blob; name: string; width: number; height: number; keptOriginal?: boolean };
}

type Target = OutType | "same";

/** Shared engine for Image Converter (pick a format) and Compress Image (pick a quality). */
export default function ImageBatch({ mode }: { mode: "convert" | "compress" }) {
  const [items, setItems] = useState<Item[]>([]);
  const [target, setTarget] = useState<Target>(mode === "convert" ? "image/webp" : "same");
  const [quality, setQuality] = useState(mode === "convert" ? 90 : 72);
  const [maxWidth, setMaxWidth] = useState<number | 0>(mode === "compress" ? 2000 : 0);
  const [busy, setBusy] = useState(false);
  const urls = useRef<string[]>([]);

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const add = (files: File[]) => {
    const fresh = files.map((file) => {
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      return { id: nextId(), file, url, status: "idle" as const };
    });
    setItems((p) => [...p.map((x) => ({ ...x, status: "idle" as const, out: undefined })), ...fresh]);
  };

  const run = async () => {
    setBusy(true);
    let saved = 0;
    let before = 0;
    for (const it of items) {
      setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: "working" } : x)));
      try {
        const type = target === "same" ? sameType(it.file) : target;
        const pngColors = mode === "compress" && type === "image/png" ? pngColorsFor(quality) : 0;
        const out = await processImage(it.file, { type, quality: quality / 100, maxWidth: maxWidth || undefined, pngColors });
        // Compressing should never make a file bigger: hand back the original instead.
        const keep = mode === "compress" && out.blob.size >= it.file.size && type === sameType(it.file);
        const final = keep ? { ...out, blob: it.file as Blob, name: it.file.name, keptOriginal: true } : out;
        before += it.file.size;
        saved += it.file.size - final.blob.size;
        setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: "done", out: final } : x)));
      } catch {
        setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: "error" } : x)));
      }
    }
    setBusy(false);
    if (mode === "compress" && before) toast.success(saved > 0 ? `Saved ${formatBytes(saved)} (${Math.round((saved / before) * 100)}%).` : "Images were already well compressed.");
    else toast.success("Images converted.");
  };

  const done = items.filter((i) => i.status === "done" && i.out);

  if (!items.length) {
    return <DropZone accept="image/*" onFiles={add} filter={isImage} label="Select images" hint="JPG, PNG, WEBP, GIF, BMP" color="#b9a0ff" />;
  }

  const formats: { value: Target; label: string }[] = [
    ...(mode === "compress" ? [{ value: "same" as Target, label: "Keep format" }] : []),
    { value: "image/jpeg", label: "JPG" },
    { value: "image/png", label: "PNG" },
    { value: "image/webp", label: "WEBP" },
  ];

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[14px] text-fg-2">{items.length} image{items.length > 1 ? "s" : ""}</p>
          <DropZone compact accept="image/*" onFiles={add} filter={isImage} label="Add more" />
        </div>
        <ul className="space-y-2">
          {items.map((it, i) => {
            const o = it.out;
            const pct = o ? Math.round((1 - o.blob.size / it.file.size) * 100) : 0;
            return (
              <FileRow
                key={it.id}
                thumb={it.url}
                name={o?.name ?? it.file.name}
                index={i}
                count={items.length}
                meta={
                  it.status === "error" ? <span className="flex items-center gap-1 text-bad"><AlertCircle size={14} /> Could not read this image</span>
                  : o ? (
                    <span>
                      {formatBytes(it.file.size)} → <b className="text-fg">{formatBytes(o.blob.size)}</b>{" "}
                      {o.keptOriginal ? <span className="text-fg-3">(already optimal)</span>
                        : <span className={pct >= 0 ? "text-ok" : "text-warn"}>{pct >= 0 ? `−${pct}%` : `+${-pct}%`}</span>}
                      <span className="hidden sm:inline"> · {o.width}×{o.height}</span>
                    </span>
                  ) : formatBytes(it.file.size)
                }
                status={
                  it.status === "working" ? <Spinner /> :
                  o ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadBlob(o.blob, o.name)} aria-label={`Download ${o.name}`}><Download size={15} /><span className="hidden sm:inline">Save</span></button>
                  : undefined
                }
                onRemove={busy ? undefined : () => setItems((p) => p.filter((x) => x.id !== it.id))}
              />
            );
          })}
        </ul>
      </div>

      <aside className="flex flex-col gap-5 rounded-2xl border border-line bg-bg/40 p-5 lg:self-start">
        <div>
          <p className="field-label">{mode === "convert" ? "Convert to" : "Output format"}</p>
          <Seg label="Output format" value={target} onChange={(v) => { setTarget(v); setItems((p) => p.map((x) => ({ ...x, status: "idle", out: undefined }))); }} options={formats} />
        </div>
        {(target !== "image/png" || mode === "compress") && (
          <div>
            <label className="field-label flex justify-between" htmlFor="q">
              Quality <span className="font-mono text-cyan">{quality}</span>
            </label>
            <input id="q" type="range" min={30} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="range" />
            <p className="text-[12.5px] text-fg-3">{quality >= 85 ? "Best quality, larger files" : quality >= 65 ? "Balanced — no visible loss for most photos" : "Smallest files, some softness"}</p>
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="mw">Max width</label>
          <select id="mw" className="input" value={maxWidth} onChange={(e) => setMaxWidth(+e.target.value)}>
            <option value={0}>Keep original size</option>
            <option value={3840}>3840 px (4K)</option>
            <option value={2000}>2000 px (web, sharp)</option>
            <option value={1600}>1600 px</option>
            <option value={1200}>1200 px (blog, email)</option>
            <option value={800}>800 px (thumbnail)</option>
          </select>
        </div>
        <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={run}>
          {busy ? <Spinner /> : <Sparkles size={20} />} {busy ? "Working…" : mode === "convert" ? "Convert images" : "Compress images"}
        </button>
        {done.length > 1 && (
          <button type="button" className="btn btn-ghost" onClick={async () => downloadBlob(await zipFiles(done.map((d) => ({ name: d.out!.name, blob: d.out!.blob }))), mode === "convert" ? "converted-images.zip" : "compressed-images.zip")}>
            <Download size={18} /> Download all (ZIP)
          </button>
        )}
      </aside>
    </div>
  );
}
