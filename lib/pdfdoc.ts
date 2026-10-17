// Tiny layout helper over pdf-lib for text documents (invoice, resume, letter).
// Uses the built-in Helvetica family, so nothing has to be downloaded.
import type { PDFDocument, PDFFont, PDFPage, RGB } from "pdf-lib";

export type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

export async function newDoc() {
  const lib = await import("pdf-lib");
  const doc = await lib.PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(lib.StandardFonts.Helvetica),
    bold: await doc.embedFont(lib.StandardFonts.HelveticaBold),
    italic: await doc.embedFont(lib.StandardFonts.HelveticaOblique),
  };
  return { lib, doc, fonts };
}

export function hexRgb(lib: typeof import("pdf-lib"), hex: string): RGB {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0"), 16);
  return lib.rgb((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Make text safe for a standard (WinAnsi) font: keep what it can draw, simplify the rest. */
export function safe(font: PDFFont, text: string) {
  const ok = new Set(font.getCharacterSet());
  let out = "";
  for (const ch of text.replace(/\r/g, "")) {
    const cp = ch.codePointAt(0)!;
    if (ok.has(cp) || ch === "\n") { out += ch; continue; }
    const plain = ch.normalize("NFKD").replace(/[̀-ͯ]/g, "");
    out += plain && [...plain].every((c) => ok.has(c.codePointAt(0)!)) ? plain : "?";
  }
  return out;
}

export function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of safe(font, text).split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) { line = test; continue; }
      if (line) lines.push(line);
      // A single word wider than the line: hard-break it.
      let w = word;
      while (font.widthOfTextAtSize(w, size) > maxWidth && w.length > 1) {
        let i = w.length;
        while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > maxWidth) i--;
        lines.push(w.slice(0, i));
        w = w.slice(i);
      }
      line = w;
    }
    lines.push(line);
  }
  return lines;
}

/** Cursor-based writer that adds pages as content flows. */
export class Writer {
  page: PDFPage;
  y: number;
  constructor(
    public doc: PDFDocument,
    public fonts: Fonts,
    public opts: { size: [number, number]; margin: number; onNewPage?: (w: Writer) => void } = { size: [595.28, 841.89], margin: 48 },
  ) {
    this.page = doc.addPage(opts.size);
    this.y = opts.size[1] - opts.margin;
  }
  get width() { return this.opts.size[0] - this.opts.margin * 2; }
  get left() { return this.opts.margin; }
  ensure(h: number) {
    if (this.y - h < this.opts.margin) {
      this.page = this.doc.addPage(this.opts.size);
      this.y = this.opts.size[1] - this.opts.margin;
      this.opts.onNewPage?.(this);
    }
  }
  /** Draw wrapped text at the cursor and move down. Returns the height used. */
  text(str: string, o: { size?: number; font?: PDFFont; color?: RGB; x?: number; width?: number; gap?: number; align?: "left" | "right" | "center" } = {}) {
    const size = o.size ?? 10.5;
    const font = o.font ?? this.fonts.regular;
    const x = o.x ?? this.left;
    const width = o.width ?? this.width - (x - this.left);
    const lh = size * (o.gap ?? 1.4);
    const lines = wrap(font, str, size, width);
    for (const ln of lines) {
      this.ensure(lh);
      const w = font.widthOfTextAtSize(ln, size);
      const dx = o.align === "right" ? width - w : o.align === "center" ? (width - w) / 2 : 0;
      this.page.drawText(ln, { x: x + dx, y: this.y - size, size, font, color: o.color });
      this.y -= lh;
    }
    return lines.length * lh;
  }
  rule(color: RGB, thickness = 0.75, x = this.left, width = this.width) {
    this.page.drawLine({ start: { x, y: this.y }, end: { x: x + width, y: this.y }, thickness, color });
  }
  space(h: number) { this.y -= h; }
}
