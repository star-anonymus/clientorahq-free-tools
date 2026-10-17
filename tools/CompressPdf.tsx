"use client";
import { useState } from "react";
import { Shrink, FileText } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { Progress, ResultPanel, Spinner } from "@/components/ui/kit";
import { baseName, canvasToBlob, downloadBlob, formatBytes } from "@/lib/files";
import { isPdf, openPdf, renderPage } from "@/lib/pdf";
import { toast } from "@/lib/toast";

type Level = "light" | "strong" | "extreme";

const LEVELS: Record<Exclude<Level, "light">, { dpi: number; q: number }> = {
  strong: { dpi: 150, q: 0.72 },
  extreme: { dpi: 100, q: 0.55 },
};

async function light(file: File) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
  // Rewriting with object streams drops unused objects and packs the rest tighter.
  doc.setProducer("ClientoraHQ Free Tools");
  return new Blob([(await doc.save({ useObjectStreams: true })) as BlobPart], { type: "application/pdf" });
}

async function raster(file: File, level: Exclude<Level, "light">, onPage: (p: number) => void) {
  const { PDFDocument } = await import("pdf-lib");
  const src = await openPdf(await file.arrayBuffer());
  const out = await PDFDocument.create();
  const { dpi, q } = LEVELS[level];
  for (let p = 1; p <= src.numPages; p++) {
    const page = await src.getPage(p);
    const vp = page.getViewport({ scale: 1, rotation: page.rotate });
    const c = await renderPage(src, p, { scale: dpi / 72 });
    const img = await out.embedJpg(new Uint8Array(await (await canvasToBlob(c, "image/jpeg", q)).arrayBuffer()));
    c.width = c.height = 0;
    // Keep the original page size in points so it prints the same.
    out.addPage([vp.width, vp.height]).drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
    onPage((p / src.numPages) * 100);
  }
  await src.loadingTask.destroy();
  return new Blob([(await out.save()) as BlobPart], { type: "application/pdf" });
}

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<Level>("strong");
  const [pct, setPct] = useState<number | null>(null);
  const [out, setOut] = useState<Blob | null>(null);

  const run = async () => {
    if (!file) return;
    setPct(level === "light" ? 50 : 0);
    try {
      setOut(level === "light" ? await light(file) : await raster(file, level, setPct));
    } catch {
      toast.error("This PDF could not be compressed. If it is password-protected, unlock it first.");
    } finally {
      setPct(null);
    }
  };

  if (out && file) {
    const saved = file.size - out.size;
    const pct = Math.round((saved / file.size) * 100);
    const worse = saved <= 0;
    return (
      <ResultPanel
        title={worse ? "Already well compressed" : `${pct}% smaller`}
        detail={<>{formatBytes(file.size)} → <b className="text-fg">{formatBytes(out.size)}</b>{worse && " — the original is smaller, so keep it or try a stronger level."}</>}
        downloadLabel={worse ? "Download anyway" : "Download compressed PDF"}
        onDownload={() => downloadBlob(out, `${baseName(file.name)}-compressed.pdf`)}
        onReset={() => { setOut(null); setFile(null); }}
      >
        {worse && level !== "extreme" && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setOut(null); setLevel(level === "light" ? "strong" : "extreme"); }}>Try a stronger level</button>}
      </ResultPanel>
    );
  }
  if (!file) return <DropZone accept="application/pdf,.pdf" multiple={false} filter={isPdf} onFiles={([f]) => setFile(f)} label="Select PDF file" color="#ff7a8a" />;
  if (pct !== null) return <div className="mx-auto max-w-md py-10"><Progress value={pct} label={level === "light" ? "Rewriting the PDF…" : `Compressing pages… ${Math.round(pct)}%`} /></div>;

  const opts: { v: Level; t: string; d: string }[] = [
    { v: "light", t: "Light", d: "Keeps text selectable and sharp. Smaller gains — best for PDFs made on a computer." },
    { v: "strong", t: "Strong (recommended)", d: "150 DPI images. Big savings for scans and photo PDFs; text becomes part of the image." },
    { v: "extreme", t: "Extreme", d: "100 DPI, lower quality. Smallest file — for upload limits like 1–2 MB." },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 p-3">
        <FileText size={22} className="flex-none text-[#ff7a8a]" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate font-semibold">{file.name}</p>
        <span className="text-[14px] text-fg-3">{formatBytes(file.size)}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>Change</button>
      </div>
      <fieldset className="space-y-2">
        <legend className="field-label">Compression level</legend>
        {opts.map((o) => (
          <label key={o.v} className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors ${level === o.v ? "border-cyan bg-cyan/[0.06]" : "border-line hover:border-line-hi"}`}>
            <input type="radio" name="lvl" className="check mt-0.5" checked={level === o.v} onChange={() => setLevel(o.v)} />
            <span><b className="block text-[15.5px]">{o.t}</b><span className="text-[14px] text-fg-2">{o.d}</span></span>
          </label>
        ))}
      </fieldset>
      <button type="button" className="btn btn-primary btn-lg w-full" onClick={run}>
        {pct !== null ? <Spinner /> : <Shrink size={20} />} Compress PDF
      </button>
    </div>
  );
}
