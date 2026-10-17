import type { NextConfig } from "next";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// pdf.js needs its worker served as a static file. Copy it out of node_modules
// so it ships with the export instead of coming from a CDN.
// Resolve from this file, not the shell's cwd, so `next dev <dir>` works too.
const root = typeof __dirname === "string" ? __dirname : process.cwd();
try {
  const src = join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
  const dir = join(root, "public");
  if (existsSync(src)) {
    mkdirSync(dir, { recursive: true });
    copyFileSync(src, join(dir, "pdf.worker.min.mjs"));
  }
} catch {
  console.warn("[next.config] could not copy the pdf.js worker");
}

// Static export: the whole site is plain files, so hosting costs nothing and
// there is no server that could ever receive a visitor's file.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
