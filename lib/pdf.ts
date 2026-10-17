/** pdf.js loader — imported lazily so pages that never render a PDF never pay for it. */
type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

export function getPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((m) => {
      // Served from /public (copied there by next.config.ts), never from a CDN.
      m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return m;
    });
  }
  return pdfjsPromise;
}

export async function openPdf(data: ArrayBuffer | Uint8Array) {
  const pdfjs = await getPdfJs();
  // pdf.js takes ownership of the buffer, so hand it a copy.
  const bytes = data instanceof Uint8Array ? data.slice() : new Uint8Array(data.slice(0));
  return pdfjs.getDocument({ data: bytes }).promise;
}

type PdfDoc = Awaited<ReturnType<typeof openPdf>>;

/** Render one page (1-based) to a canvas at a given CSS-pixel width or scale. */
export async function renderPage(doc: PdfDoc, pageNo: number, opts: { width?: number; scale?: number; rotate?: number } = {}) {
  const page = await doc.getPage(pageNo);
  const base = page.getViewport({ scale: 1, rotation: ((page.rotate + (opts.rotate ?? 0)) % 360 + 360) % 360 });
  const scale = opts.scale ?? (opts.width ? opts.width / base.width : 1);
  const viewport = page.getViewport({ scale, rotation: base.rotation });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // "print" intent renders without requestAnimationFrame, so a job keeps going
  // when the tab is in the background instead of stalling.
  await page.render({ canvas, canvasContext: ctx, viewport, intent: "print" }).promise;
  page.cleanup();
  return canvas;
}

/** Small first-page preview as a data URL, or null if the PDF can't be read. */
export async function pdfThumb(file: File, width = 160): Promise<{ url: string; pages: number } | null> {
  try {
    const doc = await openPdf(await file.arrayBuffer());
    const canvas = await renderPage(doc, 1, { width });
    const pages = doc.numPages;
    await doc.loadingTask.destroy();
    return { url: canvas.toDataURL("image/jpeg", 0.7), pages };
  } catch (err) {
    console.warn("[pdfThumb]", err);
    return null;
  }
}

if (typeof window !== "undefined") (window as unknown as Record<string, unknown>).__pdfdbg = { openPdf, renderPage, getPdfJs };

export function isPdf(f: File) {
  return f.type === "application/pdf" || /\.pdf$/i.test(f.name);
}
