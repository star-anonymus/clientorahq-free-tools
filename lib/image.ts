import { baseName, canvasToBlob, loadImage } from "./files";

export type OutType = "image/jpeg" | "image/png" | "image/webp";

export const EXT: Record<OutType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function isImage(f: File) {
  return f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name);
}

export interface ImageJob {
  type: OutType;
  /** 0..1, ignored by PNG */
  quality: number;
  /** Shrink to this width if the image is wider (keeps aspect ratio). */
  maxWidth?: number;
  /** PNG only: reduce to this many colours (TinyPNG-style lossy PNG). */
  pngColors?: number;
}

/** Lossy PNG: build a smaller colour palette, keep transparency. */
async function quantizePng(ctx: CanvasRenderingContext2D, w: number, h: number, colors: number) {
  const { default: UPNG } = await import("upng-js");
  const rgba = ctx.getImageData(0, 0, w, h).data.buffer;
  return new Blob([UPNG.encode([rgba], w, h, colors)], { type: "image/png" });
}

/** Quality slider (30–100) → palette size for PNG. */
export function pngColorsFor(quality: number) {
  return quality >= 95 ? 0 : quality >= 80 ? 256 : quality >= 60 ? 128 : quality >= 45 ? 64 : 32;
}

export interface ImageResult { blob: Blob; name: string; width: number; height: number }

/** Decode → (optionally) downscale → re-encode, all on a canvas in this tab. */
export async function processImage(file: File, job: ImageJob): Promise<ImageResult> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (job.maxWidth && w > job.maxWidth) {
      h = Math.round((h * job.maxWidth) / w);
      w = job.maxWidth;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    if (job.type === "image/jpeg") {
      ctx.fillStyle = "#ffffff"; // JPG has no alpha
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    const blob = job.type === "image/png" && job.pngColors ? await quantizePng(ctx, w, h, job.pngColors) : await canvasToBlob(canvas, job.type, job.quality);
    return { blob, name: `${baseName(file.name)}.${EXT[job.type]}`, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Map a file's own type to the closest type a canvas can write. */
export function sameType(file: File): OutType {
  if (/png$/i.test(file.type) || /\.png$/i.test(file.name)) return "image/png";
  if (/webp$/i.test(file.type) || /\.webp$/i.test(file.name)) return "image/webp";
  return "image/jpeg";
}
