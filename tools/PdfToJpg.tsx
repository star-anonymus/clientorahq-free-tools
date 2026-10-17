"use client";
import { useState } from "react";
import { Images, Download } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import PageGrid, { toRanges, usePdfThumbs } from "@/components/ui/PageGrid";
import { Progress, ResultPanel, Seg, Spinner } from "@/components/ui/kit";
import { baseName, canvasToBlob, downloadBlob, formatBytes, zipFiles } from "@/lib/files";
import { isPdf, openPdf, renderPage } from "@/lib/pdf";
import { toast } from "@/lib/toast";

type Fmt = "image/jpeg" | "image/png";

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const { thumbs, count, error } = usePdfThumbs(file, 140);
  const [sel, setSel] = useState<Set<number> | null>(null); // null = all pages
  const [fmt, setFmt] = useState<Fmt>("image/jpeg");
  const [dpi, setDpi] = useState(150);
  const [pct, setPct] = useState<number | null>(null);
  const [out, setOut] = useState<{ files: { name: string; blob: Blob }[] } | null>(null);

  const chosen = sel ?? new Set(Array.from({ length: count }, (_, i) => i));
  const toggle = (i: number) =>
    setSel((cur) => {
      const n = new Set(cur ?? Array.from({ length: count }, (_, k) => k));
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });

  const run = async () => {
    if (!file) return;
    setPct(0);
    try {
      const doc = await openPdf(await file.arrayBuffer());
      const pages = [...chosen].sort((a, b) => a - b);
      const files: { name: string; blob: Blob }[] = [];
      const ext = fmt === "image/png" ? "png" : "jpg";
      for (let k = 0; k < pages.length; k++) {
        const c = await renderPage(doc, pages[k] + 1, { scale: dpi / 72 });
        files.push({ name: `${baseName(file.name)}-page-${pages[k] + 1}.${ext}`, blob: await canvasToBlob(c, fmt, 0.9) });
        c.width = c.height = 0; // free the bitmap now, not at GC time
        setPct(((k + 1) / pages.length) * 100);
      }
      await doc.loadingTask.destroy();
      setOut({ files });
    } catch {
      toast.error("This PDF could not be converted.");
    } finally {
      setPct(null);
    }
  };

  if (out && file) {
    const total = out.files.reduce((n, f) => n + f.blob.size, 0);
    return (
      <ResultPanel
        title={`${out.files.length} image${out.files.length > 1 ? "s" : ""} ready`}
        detail={formatBytes(total)}
        downloadLabel={out.files.length > 1 ? "Download all (ZIP)" : "Download image"}
        onDownload={async () => out.files.length > 1 ? downloadBlob(await zipFiles(out.files), `${baseName(file.name)}-images.zip`) : downloadBlob(out.files[0].blob, out.files[0].name)}
        onReset={() => { setOut(null); setFile(null); setSel(null); }}
      >
        {out.files.length > 1 && (
          <ul className="flex max-w-full flex-wrap justify-center gap-2">
            {out.files.slice(0, 24).map((f) => (
              <li key={f.name}><button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadBlob(f.blob, f.name)}><Download size={14} /> {f.name.match(/page-\d+/)?.[0]}</button></li>
            ))}
          </ul>
        )}
      </ResultPanel>
    );
  }
  if (!file) return <DropZone accept="application/pdf,.pdf" multiple={false} filter={isPdf} onFiles={([f]) => setFile(f)} label="Select PDF file" color="#ff7a8a" />;
  if (error) return <p className="text-bad">This PDF could not be opened. It may be damaged or password-protected.</p>;
  if (pct !== null) return <div className="mx-auto max-w-md py-10"><Progress value={pct} label={`Rendering pages… ${Math.round(pct)}%`} /></div>;

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_300px]">
      <div>
        <p className="mb-3 text-[14px] text-fg-2">{count} pages · {chosen.size === count ? "all selected" : `${chosen.size} selected (${toRanges([...chosen])})`} — tap to include or skip</p>
        <PageGrid count={count} thumbs={thumbs} selected={chosen} onToggle={toggle} />
      </div>
      <aside className="flex flex-col gap-4 rounded-2xl border border-line bg-bg/40 p-5 lg:sticky lg:top-24 lg:self-start">
        <div><p className="field-label">Format</p><Seg label="Format" value={fmt} onChange={setFmt} options={[{ value: "image/jpeg", label: "JPG" }, { value: "image/png", label: "PNG" }]} /></div>
        <div><p className="field-label">Quality</p><Seg label="DPI" value={dpi} onChange={setDpi} options={[72, 150, 200, 300].map((d) => ({ value: d, label: `${d} DPI` }))} /></div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>Select all</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSel(new Set())}>Clear</button>
        </div>
        <button type="button" className="btn btn-primary btn-lg" disabled={!chosen.size} onClick={run}>
          {pct !== null ? <Spinner /> : <Images size={20} />} Convert {chosen.size} page{chosen.size === 1 ? "" : "s"}
        </button>
      </aside>
    </div>
  );
}
