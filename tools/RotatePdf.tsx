"use client";
import { useState } from "react";
import { RotateCcw, RotateCw, Save } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import PageGrid, { usePdfThumbs } from "@/components/ui/PageGrid";
import { ResultPanel, Spinner } from "@/components/ui/kit";
import { baseName, downloadBlob, formatBytes } from "@/lib/files";
import { isPdf } from "@/lib/pdf";
import { toast } from "@/lib/toast";

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const { thumbs, count, error } = usePdfThumbs(file, 140);
  const [rot, setRot] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Blob | null>(null);

  const all = (d: number) => setRot((r) => Object.fromEntries(Array.from({ length: count }, (_, i) => [i, (r[i] ?? 0) + d])));
  const one = (i: number) => setRot((r) => ({ ...r, [i]: (r[i] ?? 0) + 90 }));
  const changed = Object.values(rot).some((d) => ((d % 360) + 360) % 360 !== 0);

  const save = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      doc.getPages().forEach((p, i) => {
        const d = rot[i] ?? 0;
        if (d % 360) p.setRotation(degrees((((p.getRotation().angle + d) % 360) + 360) % 360));
      });
      setOut(new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" }));
    } catch {
      toast.error("This PDF could not be saved. If it is password-protected, unlock it first.");
    } finally {
      setBusy(false);
    }
  };

  if (out && file) return <ResultPanel title="Rotated PDF ready" detail={formatBytes(out.size)} downloadLabel="Download PDF" onDownload={() => downloadBlob(out, `${baseName(file.name)}-rotated.pdf`)} onReset={() => { setOut(null); setFile(null); setRot({}); }} />;
  if (!file) return <DropZone accept="application/pdf,.pdf" multiple={false} filter={isPdf} onFiles={([f]) => setFile(f)} label="Select PDF file" color="#ff7a8a" />;
  if (error) return <p className="text-bad">This PDF could not be opened. It may be damaged or password-protected.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-[14px] text-fg-2">{count} pages · tap a page to turn it 90°</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => all(-90)}><RotateCcw size={15} /> All left</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => all(90)}><RotateCw size={15} /> All right</button>
        {changed && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRot({})}>Reset</button>}
      </div>
      <PageGrid count={count} thumbs={thumbs} rotation={rot} onToggle={one}
        badge={(i) => (rot[i] ?? 0) % 360 ? <span className="absolute left-1.5 top-1.5 rounded-full bg-cyan px-1.5 text-[11px] font-bold text-ink">{(((rot[i] % 360) + 360) % 360)}°</span> : null} />
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary btn-lg" disabled={!changed || busy} onClick={save}>
          {busy ? <Spinner /> : <Save size={20} />} Save rotated PDF
        </button>
      </div>
    </div>
  );
}
