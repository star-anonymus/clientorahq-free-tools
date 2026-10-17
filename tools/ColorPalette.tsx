"use client";
import { useCallback, useEffect, useState } from "react";
import { Lock, LockOpen, RefreshCw, ImagePlus, Copy } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { CopyButton, Seg } from "@/components/ui/kit";
import { contrast, hexToHsl, hexToRgb, hslToHex, inkOn, isHex, rgbToHex } from "@/lib/color";
import { copyText, loadImage } from "@/lib/files";
import { isImage } from "@/lib/image";
import { toast } from "@/lib/toast";

type Mode = "random" | "analogous" | "complementary" | "triad" | "mono";
type Fmt = "hex" | "css" | "tailwind" | "json";
interface Swatch { hex: string; locked: boolean }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function generate(mode: Mode, seed?: string): string[] {
  // A locked colour sets the hue; lightness/saturation are pulled to a usable middle
  // so a near-black or near-white seed still gives a real palette.
  const [hs, ss, ls] = seed ? hexToHsl(seed) : [rnd(0, 360), rnd(45, 85), rnd(40, 62)];
  const [h0, s0, l0] = [hs, Math.max(35, ss), Math.min(62, Math.max(38, ls))];
  switch (mode) {
    case "analogous": return [-40, -20, 0, 20, 40].map((d, i) => hslToHex(h0 + d, s0 + rnd(-8, 8), [l0 - 18, l0 - 8, l0, l0 + 10, l0 + 22][i]));
    case "complementary": return [hslToHex(h0, s0, l0 - 20), hslToHex(h0, s0, l0), hslToHex(h0, s0 * 0.35, 94), hslToHex(h0 + 180, s0, l0 + 5), hslToHex(h0 + 180, s0, l0 - 15)];
    case "triad": return [hslToHex(h0, s0, l0), hslToHex(h0 + 120, s0, l0), hslToHex(h0 + 240, s0, l0), hslToHex(h0, s0 * 0.25, 95), hslToHex(h0, s0 * 0.4, 14)];
    case "mono": return [14, 32, 50, 70, 90].map((l) => hslToHex(h0, s0, l));
    default: {
      // Random but pleasant: spread hues, mix one light and one dark tone.
      const base = rnd(0, 360);
      return [0, 1, 2, 3, 4].map((i) => hslToHex(base + i * rnd(25, 75), rnd(40, 85), [rnd(12, 22), rnd(35, 55), rnd(45, 65), rnd(60, 75), rnd(88, 96)][i]));
    }
  }
}

/** k-means on sampled pixels → the image's main colours. */
async function extract(file: File, k = 5): Promise<string[]> {
  const img = await loadImage(file);
  const c = document.createElement("canvas");
  const scale = Math.min(1, 160 / Math.max(img.naturalWidth, img.naturalHeight));
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const px: [number, number, number][] = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 125) px.push([d[i], d[i + 1], d[i + 2]]);
  if (!px.length) return [];
  let cents = Array.from({ length: k }, (_, i) => px[Math.floor((i + 0.5) * (px.length / k))]);
  for (let it = 0; it < 12; it++) {
    const sums = cents.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let best = 0, bd = Infinity;
      cents.forEach((q, j) => { const dd = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (dd < bd) { bd = dd; best = j; } });
      const s = sums[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    cents = sums.map((s, j) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : cents[j]) as [number, number, number]);
  }
  return cents.map((q) => rgbToHex(...q)).sort((a, b) => hexToHsl(a)[2] - hexToHsl(b)[2]);
}

const NAMES = ["primary", "secondary", "accent", "muted", "surface"];

function exportAs(fmt: Fmt, hexes: string[]) {
  if (fmt === "hex") return hexes.join("\n");
  if (fmt === "css") return `:root {\n${hexes.map((h, i) => `  --color-${NAMES[i] ?? i}: ${h};`).join("\n")}\n}`;
  if (fmt === "tailwind") return `@theme {\n${hexes.map((h, i) => `  --color-${NAMES[i] ?? i}: ${h};`).join("\n")}\n}\n\n/* Tailwind v3: theme.extend.colors */\n${JSON.stringify(Object.fromEntries(hexes.map((h, i) => [NAMES[i] ?? i, h])), null, 2)}`;
  return JSON.stringify(hexes.map((h) => ({ hex: h, rgb: hexToRgb(h) })), null, 2);
}

export default function ColorPalette() {
  const [mode, setMode] = useState<Mode>("random");
  const [sw, setSw] = useState<Swatch[]>(() => ["#01121c", "#0b3d5c", "#29e6ff", "#7df3ff", "#e6f8ff"].map((hex) => ({ hex, locked: false })));
  const [fmt, setFmt] = useState<Fmt>("hex");

  const roll = useCallback(() => {
    setSw((cur) => {
      const seed = cur.find((s) => s.locked)?.hex;
      const fresh = generate(mode, mode === "random" ? undefined : seed);
      return cur.map((s, i) => (s.locked ? s : { hex: fresh[i], locked: false }));
    });
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code === "Space" && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(t.tagName)) { e.preventDefault(); roll(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [roll]);

  const hexes = sw.map((s) => s.hex);
  const code = exportAs(fmt, hexes);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Seg label="Harmony" value={mode} onChange={setMode} options={[{ value: "random", label: "Random" }, { value: "analogous", label: "Analogous" }, { value: "complementary", label: "Complementary" }, { value: "triad", label: "Triad" }, { value: "mono", label: "Mono" }]} />
        <button type="button" className="btn btn-primary" onClick={roll}><RefreshCw size={17} /> Generate</button>
        <span className="hidden text-[13px] text-fg-3 sm:inline">or press <kbd className="rounded border border-line-hi px-1.5 font-mono">Space</kbd></span>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line sm:grid-cols-5">
        {sw.map((s, i) => {
          const ink = inkOn(s.hex);
          return (
            <div key={i} className="flex min-h-[86px] items-center justify-between gap-2 px-4 py-3 sm:min-h-[260px] sm:flex-col sm:justify-end sm:py-5" style={{ background: s.hex, color: ink }}>
              <button type="button" onClick={async () => { await copyText(s.hex); toast.success(`${s.hex} copied`); }} className="cursor-pointer font-mono text-[17px] font-bold uppercase tracking-wide" aria-label={`Copy ${s.hex}`}>
                {s.hex}
              </button>
              <div className="flex items-center gap-1">
                <label className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-lg hover:bg-black/10" title="Edit colour">
                  <span className="sr-only">Edit colour {i + 1}</span>
                  <input type="color" value={s.hex} onChange={(e) => setSw((p) => p.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} className="absolute inset-0 cursor-pointer opacity-0" />
                  <span className="h-5 w-5 rounded-full border-2" style={{ borderColor: ink }} />
                </label>
                <button type="button" aria-pressed={s.locked} aria-label={s.locked ? `Unlock ${s.hex}` : `Lock ${s.hex}`} onClick={() => setSw((p) => p.map((x, j) => (j === i ? { ...x, locked: !x.locked } : x)))} className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg hover:bg-black/10">
                  {s.locked ? <Lock size={18} /> : <LockOpen size={18} className="opacity-60" />}
                </button>
                <button type="button" aria-label={`Copy ${s.hex}`} onClick={async () => { await copyText(s.hex); toast.success(`${s.hex} copied`); }} className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg hover:bg-black/10"><Copy size={17} /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-bg/40 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Seg label="Export format" value={fmt} onChange={setFmt} options={[{ value: "hex", label: "HEX" }, { value: "css", label: "CSS" }, { value: "tailwind", label: "Tailwind" }, { value: "json", label: "JSON" }]} />
            <CopyButton text={code} />
          </div>
          <pre className="max-h-64 overflow-auto rounded-xl bg-bg p-3 font-mono text-[13px] text-fg-2">{code}</pre>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-bg/40 p-4">
            <p className="field-label">Text contrast (WCAG)</p>
            <ul className="space-y-1.5 text-[13.5px]">
              {hexes.map((h, i) => {
                const best = inkOn(h);
                const r = contrast(h, best);
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="grid h-8 w-14 flex-none place-items-center rounded-md text-[12px] font-bold" style={{ background: h, color: best }}>Aa</span>
                    <span className="font-mono text-fg-2">{isHex(h) ? h : "—"}</span>
                    <span className="ml-auto font-mono">{r.toFixed(1)}:1</span>
                    <span className={`w-16 text-right font-semibold ${r >= 7 ? "text-ok" : r >= 4.5 ? "text-cyan" : "text-warn"}`}>{r >= 7 ? "AAA" : r >= 4.5 ? "AA" : "Large only"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="field-label flex items-center gap-2"><ImagePlus size={15} /> Palette from a photo</p>
            <DropZone compact accept="image/*" multiple={false} filter={isImage} label="Choose a photo" onFiles={async ([f]) => {
              try {
                const cols = await extract(f);
                if (cols.length) setSw(cols.map((hex) => ({ hex, locked: false })));
                toast.success("Palette pulled from your photo.");
              } catch { toast.error("Could not read that image."); }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
