"use client";
import { useState } from "react";
import { Scissors } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import PageGrid, { parseRanges, toRanges, usePdfThumbs } from "@/components/ui/PageGrid";
import { ResultPanel, Seg, Spinner } from "@/components/ui/kit";
import { baseName, downloadBlob, formatBytes, zipFiles } from "@/lib/files";
import { isPdf } from "@/lib/pdf";
import { toast } from "@/lib/toast";

type Mode = "extract" | "ranges" | "every";

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const { thumbs, count, error } = usePdfThumbs(file, 140);
  const [mode, setMode] = useState<Mode>("extract");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [ranges, setRanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ blob: Blob; name: string; files: number } | null>(null);

  const toggle = (i: number) =>
    setSel((cur) => {
      const n = new Set(cur);
      if (n.has(i)) n.delete(i); else n.add(i);
      setRanges(toRanges([...n]));
      return n;
    });
  const typed = (v: string) => {
    setRanges(v);
    const g = parseRanges(v, count);
    if (g) setSel(new Set(g.flat()));
  };

  const groups: number[][] | null =
    mode === "every" ? Array.from({ length: count }, (_, i) => [i])
    : mode === "ranges" ? parseRanges(ranges, count)
    : sel.size ? [[...sel].sort((a, b) => a - b)] : null;

  const run = async () => {
    if (!file || !groups?.length) return;
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const parts: { name: string; blob: Blob }[] = [];
      for (const g of groups) {
        const doc = await PDFDocument.create();
        (await doc.copyPages(src, g)).forEach((p) => doc.addPage(p));
        const label = g.length === 1 ? `page-${g[0] + 1}` : `pages-${g[0] + 1}-${g[g.length - 1] + 1}`;
        parts.push({ name: `${baseName(file.name)}-${label}.pdf`, blob: new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" }) });
      }
      setOut(parts.length === 1 ? { ...parts[0], files: 1 } : { blob: await zipFiles(parts), name: `${baseName(file.name)}-split.zip`, files: parts.length });
    } catch {
      toast.error("This PDF could not be split. If it is password-protected, unlock it first.");
    } finally {
      setBusy(false);
    }
  };

  if (out) {
    return <ResultPanel title={out.files > 1 ? `${out.files} PDFs ready` : "Your PDF is ready"} detail={`${out.files > 1 ? "ZIP" : "PDF"} · ${formatBytes(out.blob.size)}`} downloadLabel={out.files > 1 ? "Download ZIP" : "Download PDF"} onDownload={() => downloadBlob(out.blob, out.name)} onReset={() => { setOut(null); setFile(null); setSel(new Set()); setRanges(""); }} />;
  }
  if (!file) return <DropZone accept="application/pdf,.pdf" multiple={false} filter={isPdf} onFiles={([f]) => setFile(f)} label="Select PDF file" color="#ff7a8a" />;
  if (error) return <p className="text-bad">This PDF could not be opened. It may be damaged or password-protected.</p>;

  const valid = !!groups?.length;
  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_300px]">
      <div>
        <p className="mb-3 text-[14px] text-fg-2">{file.name} · {count} pages{mode === "extract" ? " · tap pages to pick them" : ""}</p>
        <PageGrid count={count} thumbs={thumbs} selected={mode === "every" ? undefined : sel} onToggle={mode === "every" ? undefined : toggle} />
      </div>
      <aside className="flex flex-col gap-4 rounded-2xl border border-line bg-bg/40 p-5 lg:sticky lg:top-24 lg:self-start">
        <Seg label="Split mode" value={mode} onChange={setMode} options={[{ value: "extract", label: "Extract" }, { value: "ranges", label: "By ranges" }, { value: "every", label: "Every page" }]} />
        {mode !== "every" && (
          <div>
            <label className="field-label" htmlFor="rng">{mode === "extract" ? "Pages" : "Ranges — each becomes a file"}</label>
            <input id="rng" className="input font-mono" value={ranges} onChange={(e) => typed(e.target.value)} placeholder={mode === "extract" ? "e.g. 1-3, 7" : "e.g. 1-3, 4-6, 7-"} />
            {ranges && !parseRanges(ranges, count) && <p className="mt-1 text-[12.5px] text-bad">Use page numbers 1–{count}, like 1-3, 5</p>}
          </div>
        )}
        <p className="text-[14px] text-fg-2">
          {mode === "extract" ? (sel.size ? `${sel.size} page${sel.size > 1 ? "s" : ""} into one new PDF.` : "Pick the pages to keep.")
            : mode === "ranges" ? (valid ? `${groups!.length} PDF file${groups!.length > 1 ? "s" : ""} (ZIP if more than one).` : "Type ranges like 1-3, 4-6.")
            : `${count} separate PDFs in a ZIP.`}
        </p>
        <button type="button" className="btn btn-primary btn-lg" disabled={!valid || busy || !count} onClick={run}>
          {busy ? <Spinner /> : <Scissors size={20} />} {busy ? "Splitting…" : "Split PDF"}
        </button>
      </aside>
    </div>
  );
}
