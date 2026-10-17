// Tiny static server for ./out with clean URLs (/merge-pdf → merge-pdf.html), for local checks only.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const port = Number(process.argv[2] ?? 4821);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".wasm": "application/wasm", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".ico": "image/x-icon" };

async function file(p) { try { return (await stat(p)).isFile() ? p : null; } catch { return null; } }

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^[/\\]+/, "");
  if (path.includes("..")) { res.writeHead(400).end(); return; }
  const base = join(root, path);
  const hit = (await file(base)) ?? (await file(`${base}.html`)) ?? (await file(join(base, "index.html")));
  if (!hit) { res.writeHead(404, { "content-type": TYPES[".html"] }).end(await readFile(join(root, "404.html"))); return; }
  const type = TYPES[extname(hit)] ?? (hit.endsWith("opengraph-image") ? "image/png" : "application/octet-stream");
  res.writeHead(200, { "content-type": type }).end(await readFile(hit));
}).listen(port, () => console.log(`serving ./out on http://localhost:${port}`));
