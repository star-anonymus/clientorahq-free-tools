"use client";
import { useEffect, useState } from "react";
import { FileDown } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { FileRow, ResultPanel, Seg, Spinner } from "@/components/ui/kit";
import { canvasToBlob, downloadBlob, formatBytes, loadImage, moveItem, nextId } from "@/lib/files";
import { isImage } from "@/lib/image";
import { toast } from "@/lib/toast";

interface Item { id: string; file: File; url: string }
type Size = "a4" | "letter" | "fit";
type Orient = "auto" | "portrait" | "landscape";
type Margin = 0 | 20 | 40;

const SIZES: Record<Exclude<Size, "fit">, [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] };

export default function ImagesToPdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [size, setSize] = useState<Size>("a4");
  const [orient, setOrient] = useState<Orient>("auto");
  const [margin, setMargin] = useState<Margin>(20);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = (files: File[]) => setItems((p) => [...p, ...files.map((file) => ({ id: nextId(), file, url: URL.createObjectURL(file) }))]);

  const build = async () => {
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      for (const it of items) {
        const bytes = new Uint8Array(await it.file.arrayBuffer());
        let img;
        if (/jpe?g$/i.test(it.file.type)) img = await pdf.embedJpg(bytes);
        else if (/png$/i.test(it.file.type)) img = await pdf.embedPng(bytes);
        else {
          // WEBP/GIF/BMP: draw to a canvas and embed as PNG so nothing is lost.
          const el = await loadImage(it.url);
          const c = document.createElement("canvas");
          c.width = el.naturalWidth;
          c.height = el.naturalHeight;
          c.getContext("2d")!.drawImage(el, 0, 0);
          img = await pdf.embedPng(new Uint8Array(await (await canvasToBlob(c, "image/png")).arrayBuffer()));
        }
        const landscapeImg = img.width > img.height;
        let pw: number, ph: number;
        if (size === "fit") {
          pw = img.width + margin * 2;
          ph = img.height + margin * 2;
        } else {
          const [w, h] = SIZES[size];
          const land = orient === "landscape" || (orient === "auto" && landscapeImg);
          [pw, ph] = land ? [h, w] : [w, h];
        }
        const page = pdf.addPage([pw, ph]);
        const scale = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height, size === "fit" ? 1 : Infinity);
        const w = img.width * scale;
        const h = img.height * scale;
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
      const out = await pdf.save();
      setResult(new Blob([out as BlobPart], { type: "application/pdf" }));
      toast.success("PDF created.");
    } catch {
      toast.error("An image could not be added. Try converting it to JPG first.");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <ResultPanel
        title="Your PDF is ready"
        detail={`${items.length} page${items.length > 1 ? "s" : ""} · ${formatBytes(result.size)}`}
        downloadLabel="Download PDF"
        onDownload={() => downloadBlob(result, "images.pdf")}
        onReset={() => { setResult(null); setItems([]); }}
      />
    );
  }

  if (!items.length) {
    return <DropZone accept="image/*" onFiles={add} filter={isImage} label="Select images" hint="JPG, PNG, WEBP" color="#ff7a8a" />;
  }

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[14px] text-fg-2">{items.length} image{items.length > 1 ? "s" : ""} · one per page</p>
          <DropZone compact accept="image/*" onFiles={add} filter={isImage} label="Add more" />
        </div>
        <ol className="space-y-2">
          {items.map((it, i) => (
            <FileRow
              key={it.id}
              thumb={it.url}
              name={it.file.name}
              meta={`Page ${i + 1} · ${formatBytes(it.file.size)}`}
              index={i}
              count={items.length}
              onMove={(a, b) => setItems((p) => moveItem(p, a, b))}
              onRemove={() => { URL.revokeObjectURL(it.url); setItems((p) => p.filter((x) => x.id !== it.id)); }}
            />
          ))}
        </ol>
      </div>
      <aside className="flex flex-col gap-5 rounded-2xl border border-line bg-bg/40 p-5 lg:self-start">
        <div>
          <p className="field-label">Page size</p>
          <Seg label="Page size" value={size} onChange={setSize} options={[{ value: "a4", label: "A4" }, { value: "letter", label: "Letter" }, { value: "fit", label: "Fit image" }]} />
        </div>
        {size !== "fit" && (
          <div>
            <p className="field-label">Orientation</p>
            <Seg label="Orientation" value={orient} onChange={setOrient} options={[{ value: "auto", label: "Auto" }, { value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }]} />
          </div>
        )}
        <div>
          <p className="field-label">Margin</p>
          <Seg label="Margin" value={margin} onChange={setMargin} options={[{ value: 0, label: "None" }, { value: 20, label: "Small" }, { value: 40, label: "Big" }]} />
        </div>
        <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={build}>
          {busy ? <Spinner /> : <FileDown size={20} />} {busy ? "Creating…" : "Create PDF"}
        </button>
      </aside>
    </div>
  );
}
