"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { Progress, ResultPanel } from "@/components/ui/kit";
import { baseName, canvasToBlob, downloadBlob, formatBytes, loadImage } from "@/lib/files";
import { isImage } from "@/lib/image";
import { toast } from "@/lib/toast";

type Bg = "transparent" | "#ffffff" | "#000000" | "custom";

const CHECKER = "repeating-conic-gradient(#d6dbe1 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px";

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [orig, setOrig] = useState("");
  const [cut, setCut] = useState<Blob | null>(null);
  const [cutUrl, setCutUrl] = useState("");
  const [stage, setStage] = useState<{ label: string; pct: number } | null>(null);
  const [bg, setBg] = useState<Bg>("transparent");
  const [custom, setCustom] = useState("#29e6ff");
  const [split, setSplit] = useState(50);
  const urls = useRef<string[]>([]);

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);
  const track = (u: string) => (urls.current.push(u), u);

  const run = async (f: File) => {
    setFile(f);
    setOrig(track(URL.createObjectURL(f)));
    setCut(null);
    setStage({ label: "Loading the AI model…", pct: 2 });
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const seen = new Map<string, [number, number]>();
      const config = {
        output: { format: "image/png" as const },
        progress: (key: string, current: number, total: number) => {
          seen.set(key, [current, total]);
          let c = 0, t = 0;
          seen.forEach(([a, b]) => { c += a; t += b; });
          if (key.startsWith("fetch")) setStage({ label: `Downloading the AI model (first time only) — ${formatBytes(c)} of ${formatBytes(t)}`, pct: t ? Math.min(90, (c / t) * 90) : 5 });
          else setStage({ label: "Cutting out the background…", pct: 95 });
        },
      };
      // The model comes in many chunks; a flaky connection can drop one. Pieces that
      // did arrive are in the browser cache, so a retry picks up where it stopped.
      let blob: Blob | undefined;
      for (let attempt = 1; ; attempt++) {
        try { blob = await removeBackground(f, config); break; }
        catch (e) {
          if (attempt >= 3 || !String(e).includes("fetch")) throw e;
          setStage((st) => ({ label: `Connection dropped — retrying (${attempt + 1}/3)…`, pct: st?.pct ?? 5 }));
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
      setCut(blob);
      setCutUrl(track(URL.createObjectURL(blob)));
      setStage(null);
      toast.success("Background removed.");
    } catch (e) {
      console.warn("[background-remover]", e);
      setStage(null);
      setFile(null);
      toast.error("Could not process this image. Check your internet for the first model download, or try a smaller photo.");
    }
  };

  const download = async () => {
    if (!cut || !file) return;
    const name = `${baseName(file.name)}-no-bg.png`;
    if (bg === "transparent") return downloadBlob(cut, name);
    const img = await loadImage(cutUrl);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg === "custom" ? custom : bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    downloadBlob(await canvasToBlob(c, "image/png"), name);
  };

  if (!file) {
    return (
      <div className="space-y-3">
        <DropZone accept="image/png,image/jpeg,image/webp" multiple={false} filter={isImage} onFiles={([f]) => run(f)} label="Select a photo" hint="JPG, PNG, WEBP" color="#b9a0ff" />
        <p className="text-center text-[13px] text-fg-3">The first run downloads the AI model (about 80 MB) to your browser. Your photo stays on your device.</p>
      </div>
    );
  }

  if (stage) {
    return (
      <div className="flex flex-col items-center gap-5 py-6">
        {orig && <img src={orig} alt="" className="max-h-64 rounded-xl opacity-60" />}
        <div className="w-full max-w-md"><Progress value={stage.pct} label={stage.label} /></div>
      </div>
    );
  }

  const shownBg = bg === "transparent" ? CHECKER : bg === "custom" ? custom : bg;

  return (
    <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        {/* Before/after: drag the slider to compare */}
        <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-xl" style={{ background: shownBg }}>
          <img src={cutUrl} alt="Photo with background removed" className="block max-h-[520px] max-w-full" />
          <img src={orig} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
          <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-cyan shadow-[0_0_10px_#29e6ff]" style={{ left: `${split}%` }} aria-hidden="true" />
        </div>
        <label className="mx-auto mt-3 block max-w-md">
          <span className="sr-only">Compare before and after</span>
          <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(+e.target.value)} className="range" />
        </label>
        <p className="text-center text-[12.5px] text-fg-3">Slide to compare the original (left) with the result (right)</p>
      </div>
      <aside className="lg:self-start">
        <ResultPanel title="Done" detail={cut ? `PNG · ${formatBytes(cut.size)}` : undefined} onReset={() => { setFile(null); setCut(null); setSplit(50); }}>
          <div className="w-full max-w-xs text-left">
            <p className="field-label">Background</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Background">
              {([["transparent", "None"], ["#ffffff", "White"], ["#000000", "Black"], ["custom", "Colour"]] as [Bg, string][]).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={bg === v} onClick={() => setBg(v)} className={`btn btn-sm ${bg === v ? "btn-primary" : "btn-ghost"}`}>{l}</button>
              ))}
              {bg === "custom" && <input type="color" aria-label="Background colour" value={custom} onChange={(e) => setCustom(e.target.value)} className="h-9 w-11 cursor-pointer rounded-lg border border-line-hi bg-transparent p-1" />}
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-lg w-full max-w-xs" onClick={download}><Download size={20} /> Download PNG</button>
        </ResultPanel>
      </aside>
    </div>
  );
}
