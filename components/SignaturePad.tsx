"use client";
import { useEffect, useRef, useState } from "react";
import { Eraser, Upload } from "lucide-react";
import { Seg } from "@/components/ui/kit";
import { loadImage } from "@/lib/files";
import { toast } from "@/lib/toast";

type Tab = "draw" | "type" | "upload";
const INKS = ["#0b1f44", "#111111", "#1d4ed8"];
const SCRIPT_FONTS = ['"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive', '"Ink Free", "Bradley Hand", "Comic Sans MS", cursive', 'Georgia, "Times New Roman", serif'];

/** Crop a canvas to its non-transparent pixels and return a PNG data URL. */
function trimmed(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!;
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const pad = 6;
  const out = document.createElement("canvas");
  out.width = x1 - x0 + pad * 2;
  out.height = y1 - y0 + pad * 2;
  out.getContext("2d")!.drawImage(c, x0 - pad, y0 - pad, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

export default function SignaturePad({ onDone, onCancel }: { onDone: (png: string) => void; onCancel: () => void }) {
  const [tab, setTab] = useState<Tab>("draw");
  const [ink, setInk] = useState(INKS[0]);
  const [typed, setTyped] = useState("");
  const [font, setFont] = useState(0);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c || tab !== "draw") return;
    const r = c.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setHasInk(false);
  }, [tab]);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = pos(e); };
  const move = (e: React.PointerEvent) => {
    if (!last.current) return;
    const p = pos(e);
    const ctx = canvas.current!.getContext("2d")!;
    ctx.strokeStyle = ink;
    // Thinner when moving fast, like a real pen.
    const speed = Math.hypot(p.x - last.current.x, p.y - last.current.y);
    ctx.lineWidth = Math.max(1.6, 3.4 - speed * 0.08) * (e.pressure && e.pointerType === "pen" ? 0.6 + e.pressure : 1);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, (last.current.x + p.x) / 2, (last.current.y + p.y) / 2);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setHasInk(true);
  };
  const up = () => { last.current = null; };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const finish = async () => {
    if (tab === "draw") {
      const png = canvas.current && trimmed(canvas.current);
      if (png) onDone(png);
      return;
    }
    if (tab === "type") {
      const c = document.createElement("canvas");
      c.width = 1400;
      c.height = 300;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = ink;
      ctx.font = `150px ${SCRIPT_FONTS[font]}`;
      ctx.textBaseline = "middle";
      ctx.fillText(typed, 20, 160, 1360);
      const png = trimmed(c);
      if (png) onDone(png);
      return;
    }
    if (uploaded) onDone(uploaded);
  };

  /** Uploaded photo of a signature: make light paper transparent. */
  const takeUpload = async (f: File) => {
    try {
      const img = await loadImage(f);
      const c = document.createElement("canvas");
      const s = Math.min(1, 1200 / img.naturalWidth);
      c.width = img.naturalWidth * s;
      c.height = img.naturalHeight * s;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const lum = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
        d.data[i + 3] = lum > 200 ? 0 : lum > 150 ? Math.round(((200 - lum) / 50) * d.data[i + 3]) : d.data[i + 3];
      }
      ctx.putImageData(d, 0, 0);
      setUploaded(trimmed(c));
    } catch {
      toast.error("Could not read that image.");
    }
  };

  const ready = tab === "draw" ? hasInk : tab === "type" ? !!typed.trim() : !!uploaded;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Seg label="Signature type" value={tab} onChange={setTab} options={[{ value: "draw", label: "Draw" }, { value: "type", label: "Type" }, { value: "upload", label: "Upload" }]} />
        {tab !== "upload" && (
          <div className="flex gap-2" role="group" aria-label="Ink colour">
            {INKS.map((c) => <button key={c} type="button" aria-label={`Ink ${c}`} aria-pressed={ink === c} onClick={() => setInk(c)} className={`h-8 w-8 cursor-pointer rounded-full border-2 ${ink === c ? "border-cyan" : "border-transparent"}`} style={{ background: c }} />)}
          </div>
        )}
      </div>

      {tab === "draw" && (
        <div className="relative">
          <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
            className="h-48 w-full cursor-crosshair touch-none rounded-xl bg-white" aria-label="Draw your signature here" />
          <span className="pointer-events-none absolute inset-x-8 bottom-10 border-b border-dashed border-[#b8c0ca]" />
          {!hasInk && <span className="pointer-events-none absolute inset-0 grid place-items-center text-[15px] text-[#8a95a3]">Sign here with your mouse, finger or pen</span>}
          <button type="button" onClick={clear} className="btn btn-sm absolute right-2 top-2 border-[#d0d6dd] bg-white text-[#1a1f26]"><Eraser size={14} /> Clear</button>
        </div>
      )}
      {tab === "type" && (
        <div className="space-y-3">
          <label className="sr-only" htmlFor="sigtxt">Your name</label>
          <input id="sigtxt" className="input" placeholder="Type your full name" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          <div className="grid gap-2 sm:grid-cols-3">
            {SCRIPT_FONTS.map((f, i) => (
              <button key={f} type="button" aria-pressed={font === i} onClick={() => setFont(i)} className={`h-20 cursor-pointer truncate rounded-xl border-2 bg-white px-3 text-[28px] ${font === i ? "border-cyan" : "border-transparent"}`} style={{ fontFamily: f, color: ink }}>
                {typed || "Your Name"}
              </button>
            ))}
          </div>
        </div>
      )}
      {tab === "upload" && (
        <div className="grid min-h-48 place-items-center rounded-xl border-2 border-dashed border-line-hi bg-bg/40 p-4">
          {uploaded ? <img src={uploaded} alt="Uploaded signature" className="max-h-36 rounded bg-white p-2" /> : (
            <label className="btn btn-ghost"><Upload size={16} /> Photo of your signature
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && takeUpload(e.target.files[0])} />
            </label>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={finish}>Use this signature</button>
      </div>
    </div>
  );
}
