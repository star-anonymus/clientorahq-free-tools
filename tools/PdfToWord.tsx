"use client";
import { useState } from "react";
import { FileType2, Download, AlertCircle } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { FileRow, Progress, Spinner } from "@/components/ui/kit";
import { baseName, downloadBlob, formatBytes, nextId, zipFiles } from "@/lib/files";
import { isPdf, openPdf } from "@/lib/pdf";
import { toast } from "@/lib/toast";

interface Item {
  id: string;
  file: File;
  status: "idle" | "working" | "done" | "error";
  progress?: number;
  blob?: Blob;
  note?: string;
}

interface Line { y: number; size: number; text: string }

/** Read text out of one PDF and lay it into paragraphs and headings. */
async function convert(file: File, onProgress: (p: number) => void) {
  const [{ Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType }, doc] = await Promise.all([
    import("docx"),
    file.arrayBuffer().then(openPdf),
  ]);
  const children: InstanceType<typeof Paragraph>[] = [];
  let chars = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lines: Line[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const size = Math.round(Math.hypot(item.transform[2], item.transform[3]));
      const line = lines.find((l) => Math.abs(l.y - y) <= 2);
      if (line) {
        line.text += (line.text.endsWith(" ") || item.str.startsWith(" ") ? "" : " ") + item.str;
        line.size = Math.max(line.size, size);
      } else lines.push({ y, size, text: item.str });
    }
    lines.sort((a, b) => b.y - a.y);
    const body = median(lines.map((l) => l.size)) || 11;

    if (p > 1) children.push(new Paragraph({ children: [new TextRun({ text: `Page ${p}`, color: "999999", size: 16 })], alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 } }));

    // Join lines into paragraphs; a big vertical gap or a bigger font starts a new one.
    let buf: Line[] = [];
    const flush = () => {
      if (!buf.length) return;
      const text = buf.map((l) => l.text.trim()).join(" ").replace(/\s+/g, " ").replace(/- (\p{Ll})/gu, "$1");
      const size = buf[0].size;
      chars += text.length;
      const heading = size >= body * 1.5 ? HeadingLevel.HEADING_1 : size >= body * 1.2 ? HeadingLevel.HEADING_2 : undefined;
      children.push(heading ? new Paragraph({ text, heading, spacing: { before: 240, after: 120 } }) : new Paragraph({ children: [new TextRun(text)], spacing: { after: 160 } }));
      buf = [];
    };
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const prev = lines[i - 1];
      if (prev && (prev.y - l.y > Math.max(prev.size, l.size) * 1.7 || Math.abs(prev.size - l.size) > 1.5)) flush();
      buf.push(l);
    }
    flush();
    page.cleanup();
    onProgress((p / doc.numPages) * 100);
  }
  const pages = doc.numPages;
  await doc.loadingTask.destroy();
  const out = new Document({ creator: "ClientoraHQ Free Tools", title: baseName(file.name), sections: [{ children }] });
  return { blob: await Packer.toBlob(out), pages, empty: chars < 20 };
}

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export default function PdfToWord() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  const patch = (id: string, p: Partial<Item>) => setItems((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const run = async () => {
    setBusy(true);
    for (const it of items) {
      if (it.status === "done") continue;
      patch(it.id, { status: "working", progress: 0 });
      try {
        const r = await convert(it.file, (progress) => patch(it.id, { progress }));
        patch(it.id, { status: "done", blob: r.blob, note: r.empty ? "Almost no text found — this looks like a scanned PDF." : `${r.pages} page${r.pages > 1 ? "s" : ""}` });
      } catch {
        patch(it.id, { status: "error", note: "Could not read this PDF (it may be password-protected)." });
      }
    }
    setBusy(false);
    toast.success("Conversion finished — download your Word files.");
  };

  const done = items.filter((i) => i.status === "done" && i.blob);

  if (!items.length) {
    return <DropZone accept="application/pdf,.pdf" onFiles={(f) => setItems(f.map((file) => ({ id: nextId(), file, status: "idle" })))} filter={isPdf} label="Select PDF files" color="#ff7a8a" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] text-fg-2">{items.length} PDF{items.length > 1 ? "s" : ""}</p>
        <DropZone compact accept="application/pdf,.pdf" filter={isPdf} label="Add more" onFiles={(f) => setItems((p) => [...p, ...f.map((file) => ({ id: nextId(), file, status: "idle" as const }))])} />
      </div>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <FileRow
            key={it.id}
            thumb={null}
            name={it.file.name}
            index={i}
            count={items.length}
            meta={
              it.status === "working" ? <span className="block pt-1"><Progress value={it.progress ?? 0} /></span>
              : it.status === "error" ? <span className="flex items-center gap-1 text-bad"><AlertCircle size={14} /> {it.note}</span>
              : <>{formatBytes(it.file.size)}{it.note ? ` · ${it.note}` : ""}</>
            }
            status={it.status === "done" && it.blob ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadBlob(it.blob!, `${baseName(it.file.name)}.docx`)}>
                <Download size={15} /> .docx
              </button>
            ) : undefined}
            onRemove={busy ? undefined : () => setItems((p) => p.filter((x) => x.id !== it.id))}
          />
        ))}
      </ol>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {done.length > 1 && (
          <button type="button" className="btn btn-ghost" onClick={async () => downloadBlob(await zipFiles(done.map((d) => ({ name: `${baseName(d.file.name)}.docx`, blob: d.blob! }))), "word-files.zip")}>
            <Download size={18} /> Download all (ZIP)
          </button>
        )}
        <button type="button" className="btn btn-primary btn-lg" disabled={busy || items.every((i) => i.status === "done")} onClick={run}>
          {busy ? <Spinner /> : <FileType2 size={20} />} {busy ? "Converting…" : "Convert to Word"}
        </button>
      </div>
    </div>
  );
}
