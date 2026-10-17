"use client";
import { useEffect, useRef, useState } from "react";
import { PenLine, CalendarDays, Type as TypeIcon, Trash2, Minus, Plus, Download, X } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import SignaturePad from "@/components/SignaturePad";
import { ResultPanel, Spinner } from "@/components/ui/kit";
import { baseName, downloadBlob, formatBytes } from "@/lib/files";
import { isPdf, openPdf, renderPage } from "@/lib/pdf";
import { useLocal } from "@/lib/store";
import { toast } from "@/lib/toast";

type Kind = "sig" | "date" | "text";
/** Positions are fractions of the page as shown, so they survive any zoom. */
interface Field { id: string; page: number; kind: Kind; x: number; y: number; w: number; h: number; text?: string; src?: string }
interface PageView { url: string; w: number; h: number } // w/h in PDF points as displayed (rotation applied)

type PdfDoc = Awaited<ReturnType<typeof openPdf>>;

const uid = () => Math.random().toString(36).slice(2, 9);
const todayStr = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageView[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [tool, setTool] = useState<Kind | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [sig, setSig] = useLocal<string>("cq-signature", "");
  const [pad, setPad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Blob | null>(null);
  const doc = useRef<PdfDoc | null>(null);
  const drag = useRef<{ id: string; mode: "move" | "resize"; sx: number; sy: number; f: Field; pw: number; ph: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    let live = true;
    setPages([]);
    (async () => {
      try {
        const d = await openPdf(await file.arrayBuffer());
        doc.current = d;
        for (let p = 1; p <= d.numPages && live; p++) {
          const page = await d.getPage(p);
          const vp = page.getViewport({ scale: 1, rotation: page.rotate });
          const c = await renderPage(d, p, { width: Math.min(1600, vp.width * 2) });
          const view = { url: c.toDataURL("image/jpeg", 0.85), w: vp.width, h: vp.height };
          if (live) setPages((ps) => [...ps, view]);
        }
      } catch {
        toast.error("This PDF could not be opened. It may be damaged or password-protected.");
        setFile(null);
      }
    })();
    return () => { live = false; };
  }, [file]);

  const place = (page: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!tool) { setActive(null); return; }
    if (tool === "sig" && !sig) { setPad(true); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const pv = pages[page];
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    // Sizes in points → fractions of this page.
    const [wPt, hPt] = tool === "sig" ? [170, 60] : tool === "date" ? [110, 20] : [180, 20];
    const w = wPt / pv.w, h = hPt / pv.h;
    const f: Field = { id: uid(), page, kind: tool, x: Math.min(1 - w, Math.max(0, fx - w / 2)), y: Math.min(1 - h, Math.max(0, fy - h / 2)), w, h, text: tool === "date" ? todayStr() : tool === "text" ? "" : undefined, src: tool === "sig" ? sig : undefined };
    if (tool === "sig") {
      // Keep the signature's own shape.
      const img = new Image();
      img.onload = () => setFields((fs) => fs.map((x) => (x.id === f.id ? { ...x, h: (x.w * pv.w * (img.naturalHeight / img.naturalWidth)) / pv.h } : x)));
      img.src = sig;
    }
    setFields((fs) => [...fs, f]);
    setActive(f.id);
    setTool(null);
  };

  const onPointerDown = (e: React.PointerEvent, f: Field, mode: "move" | "resize") => {
    e.stopPropagation();
    const pageEl = (e.currentTarget as HTMLElement).closest("[data-page]") as HTMLElement;
    const r = pageEl.getBoundingClientRect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: f.id, mode, sx: e.clientX, sy: e.clientY, f, pw: r.width, ph: r.height };
    setActive(f.id);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / d.pw;
    const dy = (e.clientY - d.sy) / d.ph;
    setFields((fs) => fs.map((x) => {
      if (x.id !== d.id) return x;
      if (d.mode === "move") return { ...x, x: Math.min(1 - x.w, Math.max(0, d.f.x + dx)), y: Math.min(1 - x.h, Math.max(0, d.f.y + dy)) };
      const k = Math.max(0.3, (d.f.w + dx) / d.f.w);
      return { ...x, w: Math.min(1 - x.x, d.f.w * k), h: Math.min(1 - x.y, d.f.h * k) };
    }));
  };
  const onPointerUp = () => { drag.current = null; };

  const patch = (id: string, p: Partial<Field>) => setFields((fs) => fs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const scale = (f: Field, k: number) => patch(f.id, { w: Math.min(1 - f.x, f.w * k), h: Math.min(1 - f.y, f.h * k) });
  const onKey = (e: React.KeyboardEvent, f: Field) => {
    const step = e.shiftKey ? 0.02 : 0.004;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      patch(f.id, { x: Math.min(1 - f.w, Math.max(0, f.x + moves[e.key][0])), y: Math.min(1 - f.h, Math.max(0, f.y + moves[e.key][1])) });
    } else if ((e.key === "Delete" || e.key === "Backspace") && f.kind === "sig") {
      setFields((fs) => fs.filter((x) => x.id !== f.id));
    }
  };

  const save = async () => {
    if (!file || !doc.current) return;
    setBusy(true);
    try {
      const { PDFDocument, StandardFonts, degrees, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const imgCache = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>();
      for (const f of fields) {
        if (f.kind !== "sig" && !f.text?.trim()) continue;
        const page = pdf.getPage(f.page);
        const pj = await doc.current.getPage(f.page + 1);
        const vp = pj.getViewport({ scale: 1, rotation: pj.rotate });
        const rot = pj.rotate;
        const W = vp.width, H = vp.height;
        const [x, y, w, h] = [f.x * W, f.y * H, f.w * W, f.h * H];
        // Anchor at the field's bottom-left as seen on screen, then turn with the page.
        if (f.kind === "sig" && f.src) {
          let img = imgCache.get(f.src);
          if (!img) { img = await pdf.embedPng(f.src); imgCache.set(f.src, img); }
          const [ax, ay] = vp.convertToPdfPoint(x, y + h);
          page.drawImage(img, { x: ax, y: ay, width: w, height: h, rotate: degrees(rot) });
        } else {
          const size = h * 0.72;
          const [ax, ay] = vp.convertToPdfPoint(x + 2, y + h * 0.78);
          const safeText = [...(f.text ?? "")].map((ch) => (font.getCharacterSet().includes(ch.codePointAt(0)!) ? ch : "?")).join("");
          page.drawText(safeText, { x: ax, y: ay, size, font, color: rgb(0.05, 0.08, 0.2), rotate: degrees(rot) });
        }
      }
      setOut(new Blob([(await pdf.save()) as BlobPart], { type: "application/pdf" }));
    } catch {
      toast.error("Could not save the signed PDF.");
    } finally {
      setBusy(false);
    }
  };

  if (out && file) {
    return <ResultPanel title="Signed PDF ready" detail={formatBytes(out.size)} downloadLabel="Download signed PDF" onDownload={() => downloadBlob(out, `${baseName(file.name)}-signed.pdf`)} onReset={() => { setOut(null); setFile(null); setFields([]); doc.current = null; }} />;
  }
  if (!file) return <DropZone accept="application/pdf,.pdf" multiple={false} filter={isPdf} onFiles={([f]) => setFile(f)} label="Select PDF to sign" color="#ff7a8a" />;

  const toolBtn = (k: Kind, label: string, icon: React.ReactNode) => (
    <button type="button" aria-pressed={tool === k} onClick={() => { if (k === "sig" && !sig) setPad(true); else setTool(tool === k ? null : k); }} className={`btn btn-sm ${tool === k ? "btn-primary" : "btn-ghost"}`}>{icon} {label}</button>
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-[68px] z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-line bg-bg-2/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {sig && <img src={sig} alt="Your signature" className="h-9 max-w-[110px] rounded bg-white object-contain px-1" />}
        {toolBtn("sig", "Signature", <PenLine size={15} />)}
        {toolBtn("date", "Date", <CalendarDays size={15} />)}
        {toolBtn("text", "Text", <TypeIcon size={15} />)}
        {sig && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPad(true)}>Change signature</button>}
        <button type="button" className="btn btn-primary ml-auto" disabled={!fields.length || busy} onClick={save}>
          {busy ? <Spinner /> : <Download size={17} />} Finish &amp; download
        </button>
        <p className="w-full text-[13px] text-fg-3" aria-live="polite">
          {tool ? `Tap the page where the ${tool === "sig" ? "signature" : tool} should go.` : fields.length ? "Drag to move, pull the corner to resize, or select and use arrow keys." : "Pick Signature, Date or Text, then tap the page."}
        </p>
      </div>

      {pad && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Create your signature">
          <div className="panel w-full max-w-xl bg-bg-2 p-5">
            <div className="mb-3 flex items-center justify-between"><p className="text-[18px] font-bold">Your signature</p><button type="button" aria-label="Close" className="btn btn-ghost btn-icon" onClick={() => setPad(false)}><X size={18} /></button></div>
            <SignaturePad onCancel={() => setPad(false)} onDone={(png) => { setSig(png); setPad(false); setTool("sig"); }} />
            <p className="mt-3 text-[12.5px] text-fg-3">Saved in this browser only, so you can reuse it next time.</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[820px] space-y-5" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        {!pages.length && <div className="grid h-96 place-items-center"><Spinner size={28} /></div>}
        {pages.map((p, i) => (
          <div key={i}>
            <p className="mb-1 text-center text-[12.5px] text-fg-3">Page {i + 1} of {doc.current?.numPages ?? pages.length}</p>
            <div data-page={i} onClick={(e) => place(i, e)} className={`relative select-none overflow-visible rounded-md bg-white [container-type:size] shadow-2xl shadow-black/50 ${tool ? "cursor-crosshair" : ""}`} style={{ aspectRatio: `${p.w} / ${p.h}` }}>
              <img src={p.url} alt={`Page ${i + 1}`} className="pointer-events-none h-full w-full" draggable={false} />
              {fields.filter((f) => f.page === i).map((f) => {
                const on = active === f.id;
                return (
                  <div key={f.id} tabIndex={0} role="group" aria-label={`${f.kind === "sig" ? "Signature" : f.kind === "date" ? "Date" : "Text"} field`}
                    onKeyDown={(e) => onKey(e, f)} onClick={(e) => { e.stopPropagation(); setActive(f.id); }}
                    className={`absolute rounded-sm ${on ? "outline-2 outline-cyan outline-dashed" : "hover:outline hover:outline-1 hover:outline-cyan/60"}`}
                    style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%` }}>
                    <div className="h-full w-full cursor-move touch-none" onPointerDown={(e) => onPointerDown(e, f, "move")}>
                      {f.kind === "sig" ? <img src={f.src} alt="" className="pointer-events-none h-full w-full object-contain" draggable={false} />
                        : <input value={f.text} onChange={(e) => patch(f.id, { text: e.target.value })} onPointerDown={(e) => e.stopPropagation()} placeholder="Type…" aria-label={f.kind === "date" ? "Date text" : "Text"}
                            className="h-full w-full bg-transparent px-0.5 font-[Helvetica,Arial,sans-serif] text-[#0d1433] outline-none" style={{ fontSize: `${f.h * 72}cqh` }} />}
                    </div>
                    {on && (
                      <>
                        <span onPointerDown={(e) => onPointerDown(e, f, "resize")} className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-cyan" aria-hidden="true" />
                        <div className="absolute -top-10 left-0 flex gap-1 rounded-lg border border-line-hi bg-bg-2 p-1 shadow-lg" onPointerDown={(e) => e.stopPropagation()}>
                          <button type="button" aria-label="Smaller" className="grid h-7 w-7 cursor-pointer place-items-center rounded text-fg hover:bg-cyan/10" onClick={(e) => { e.stopPropagation(); scale(f, 0.9); }}><Minus size={14} /></button>
                          <button type="button" aria-label="Bigger" className="grid h-7 w-7 cursor-pointer place-items-center rounded text-fg hover:bg-cyan/10" onClick={(e) => { e.stopPropagation(); scale(f, 1.1); }}><Plus size={14} /></button>
                          <button type="button" aria-label="Delete field" className="grid h-7 w-7 cursor-pointer place-items-center rounded text-bad hover:bg-bad/10" onClick={(e) => { e.stopPropagation(); setFields((fs) => fs.filter((x) => x.id !== f.id)); setActive(null); }}><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
