"use client";
import { useState } from "react";
import { Combine } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { FileRow, ResultPanel, Spinner } from "@/components/ui/kit";
import { downloadBlob, formatBytes, moveItem, nextId } from "@/lib/files";
import { isPdf, pdfThumb } from "@/lib/pdf";
import { toast } from "@/lib/toast";

interface Item { id: string; file: File; thumb?: string | null; pages?: number }

export default function MergePdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; pages: number } | null>(null);

  const add = (files: File[]) => {
    const fresh = files.map((file) => ({ id: nextId(), file }));
    setItems((p) => [...p, ...fresh]);
    for (const it of fresh) {
      pdfThumb(it.file, 120).then((t) =>
        setItems((p) => p.map((x) => (x.id === it.id ? { ...x, thumb: t?.url ?? null, pages: t?.pages } : x))),
      );
    }
  };

  const merge = async () => {
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const it of items) {
        const src = await PDFDocument.load(await it.file.arrayBuffer(), { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      setResult({ blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), pages: out.getPageCount() });
      toast.success("PDFs merged.");
    } catch {
      toast.error("One of the files could not be read. If it is password-protected, unlock it first.");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <ResultPanel
        title="Your PDF is ready"
        detail={`${result.pages} pages · ${formatBytes(result.blob.size)}`}
        downloadLabel="Download merged PDF"
        onDownload={() => downloadBlob(result.blob, "merged.pdf")}
        onReset={() => { setResult(null); setItems([]); }}
      />
    );
  }

  if (!items.length) {
    return <DropZone accept="application/pdf,.pdf" onFiles={add} filter={isPdf} label="Select PDF files" color="#ff7a8a" />;
  }

  const totalPages = items.reduce((n, i) => n + (i.pages ?? 0), 0);

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_280px]">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[14px] text-fg-2">{items.length} file{items.length > 1 ? "s" : ""} · merged top to bottom</p>
          <DropZone compact accept="application/pdf,.pdf" onFiles={add} filter={isPdf} label="Add more" />
        </div>
        <ol className="space-y-2">
          {items.map((it, i) => (
            <FileRow
              key={it.id}
              thumb={it.thumb}
              name={it.file.name}
              meta={`${it.pages ? `${it.pages} page${it.pages > 1 ? "s" : ""} · ` : ""}${formatBytes(it.file.size)}`}
              index={i}
              count={items.length}
              onMove={(a, b) => setItems((p) => moveItem(p, a, b))}
              onRemove={() => setItems((p) => p.filter((x) => x.id !== it.id))}
            />
          ))}
        </ol>
      </div>
      <aside className="flex flex-col gap-4 rounded-2xl border border-line bg-bg/40 p-5 lg:self-start">
        <p className="text-[15px] font-semibold">Merge PDF</p>
        <p className="text-[14px] text-fg-2">
          {items.length < 2 ? "Add at least one more PDF to merge." : `${items.length} files${totalPages ? `, ${totalPages} pages` : ""} will become one PDF.`}
        </p>
        <button type="button" className="btn btn-primary btn-lg" disabled={items.length < 2 || busy} onClick={merge}>
          {busy ? <Spinner /> : <Combine size={20} />} {busy ? "Merging…" : "Merge PDF"}
        </button>
      </aside>
    </div>
  );
}
