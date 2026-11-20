// ClientoraHQ share Worker: Loom-style links for the free screen recorder (tools.clientorahq.com/screen-recorder).
// The visitor chooses "Get share link"; the video is uploaded in parts to R2 and gets an unlisted link
// https://share.clientorahq.com/v/<id> that anyone with the link can watch until it expires (30 days).
// The uploader gets a private delete key (kept in their browser) to remove it sooner.
//
// Routes:
//   POST   /upload/start            {type, size}            -> {id, uploadId, partSize, deleteKey}
//   PUT    /upload/<id>/<n>?u=<uploadId>   body = part n     -> {etag}
//   POST   /upload/<id>/done?u=<uploadId>  {parts:[{n,etag}]} -> {url}
//   GET    /v/<id>                  watch page (HTML)
//   GET    /f/<id>                  the video file (Range requests supported)
//   DELETE /v/<id>                  header X-Delete-Key      -> 204

export interface Env {
  SHARES: R2Bucket;
  LIMITER?: { limit(o: { key: string }): Promise<{ success: boolean }> };
  ALLOWED_ORIGINS: string;
  PUBLIC_URL: string;
}

const DAYS = 30;
const MAX_BYTES = 1024 * 1024 * 1024; // 1 GB
const PART = 50 * 1024 * 1024; // 50 MB parts (a Worker request body is at most 100 MB)
const TYPES: Record<string, string> = { "video/webm": "webm", "video/mp4": "mp4" };
const ID = /^[a-z0-9]{12}$/;

const rand = (n: number) => {
  const abc = "abcdefghijkmnpqrstuvwxyz23456789";
  const b = crypto.getRandomValues(new Uint8Array(n));
  return [...b].map((x) => abc[x % abc.length]).join("").padEnd(n, "a");
};
const id12 = () => {
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  return [...crypto.getRandomValues(new Uint8Array(12))].map((x) => abc[x % 36]).join("");
};
async function sha(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function cors(req: Request, env: Env): Record<string, string> {
  const o = req.headers.get("Origin") || "";
  const ok = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).includes(o);
  return ok ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,X-Delete-Key", "Access-Control-Max-Age": "86400", Vary: "Origin" } : { Vary: "Origin" };
}
const json = (data: unknown, status: number, h: Record<string, string>) =>
  new Response(JSON.stringify(data), { status, headers: { ...h, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const fail = (msg: string, status: number, h: Record<string, string>) => json({ error: msg }, status, h);

const expired = (meta: Record<string, string> | undefined) => !meta?.expires || Date.parse(meta.expires) < Date.now();

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const h = cors(req, env);
    const p = url.pathname.split("/").filter(Boolean);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    try {
      // ---- uploads: only from our own pages, and rate-limited per IP ----
      if (p[0] === "upload") {
        if (!h["Access-Control-Allow-Origin"]) return fail("Uploads are only accepted from tools.clientorahq.com.", 403, h);
        const ip = req.headers.get("CF-Connecting-IP") || "local";
        if (env.LIMITER && !(await env.LIMITER.limit({ key: ip })).success) return fail("Too many uploads right now. Wait a minute and press Retry.", 429, h);

        if (req.method === "POST" && p[1] === "start") {
          const b = (await req.json().catch(() => ({}))) as { type?: string; size?: number };
          const type = String(b.type || "").split(";")[0];
          const size = Number(b.size);
          if (!TYPES[type]) return fail("Only WebM or MP4 videos can be shared.", 400, h);
          if (!(size > 0)) return fail("The video is empty.", 400, h);
          if (size > MAX_BYTES) return fail("Videos up to 1 GB can be shared. Record a shorter video or download this one instead.", 413, h);
          const id = id12();
          const deleteKey = rand(24);
          const expires = new Date(Date.now() + DAYS * 864e5).toISOString();
          const up = await env.SHARES.createMultipartUpload(`v/${id}`, {
            httpMetadata: { contentType: type },
            customMetadata: { expires, size: String(size), del: await sha(deleteKey), created: new Date().toISOString() },
          });
          return json({ id, uploadId: up.uploadId, partSize: PART, deleteKey, expires }, 200, h);
        }
        if (req.method === "PUT" && ID.test(p[1] || "") && /^\d{1,3}$/.test(p[2] || "")) {
          const n = Number(p[2]);
          const len = Number(req.headers.get("Content-Length") || 0);
          if (n < 1 || n * PART > MAX_BYTES + PART || !req.body) return fail("Upload part is not valid.", 400, h);
          if (len > PART) return fail("Upload part is too big.", 413, h);
          const up = env.SHARES.resumeMultipartUpload(`v/${p[1]}`, url.searchParams.get("u") || "");
          const part = await up.uploadPart(n, req.body);
          return json({ etag: part.etag }, 200, h);
        }
        if (req.method === "POST" && ID.test(p[1] || "") && p[2] === "done") {
          const b = (await req.json().catch(() => ({}))) as { parts?: { n: number; etag: string }[] };
          const parts = (b.parts || []).map((x) => ({ partNumber: Number(x.n), etag: String(x.etag) }));
          if (!parts.length) return fail("No parts were uploaded.", 400, h);
          const up = env.SHARES.resumeMultipartUpload(`v/${p[1]}`, url.searchParams.get("u") || "");
          await up.complete(parts);
          return json({ url: `${env.PUBLIC_URL}/v/${p[1]}` }, 200, h);
        }
        return fail("Not found.", 404, h);
      }

      // ---- the video file, with Range support so the player can seek ----
      if (p[0] === "f" && ID.test(p[1] || "") && (req.method === "GET" || req.method === "HEAD")) {
        const head = await env.SHARES.head(`v/${p[1]}`);
        if (!head || expired(head.customMetadata)) return new Response("This video was deleted or has expired.", { status: 404 });
        const obj = await env.SHARES.get(`v/${p[1]}`, { range: req.headers });
        if (!obj) return new Response("This video was deleted or has expired.", { status: 404 });
        const hd = new Headers();
        obj.writeHttpMetadata(hd);
        hd.set("Accept-Ranges", "bytes");
        hd.set("Cache-Control", "private, max-age=3600");
        hd.set("X-Content-Type-Options", "nosniff");
        if (url.searchParams.has("download")) hd.set("Content-Disposition", `attachment; filename="screen-recording-${p[1]}.${TYPES[obj.httpMetadata?.contentType || ""] || "webm"}"`);
        const r = (obj as R2ObjectBody & { range?: { offset?: number; length?: number } }).range;
        if (r && req.headers.has("Range")) {
          const off = r.offset ?? 0;
          const len = r.length ?? obj.size - off;
          hd.set("Content-Range", `bytes ${off}-${off + len - 1}/${obj.size}`);
          hd.set("Content-Length", String(len));
          return new Response(req.method === "HEAD" ? null : obj.body, { status: 206, headers: hd });
        }
        hd.set("Content-Length", String(obj.size));
        return new Response(req.method === "HEAD" ? null : obj.body, { status: 200, headers: hd });
      }

      // ---- delete with the private key the uploader got ----
      if (p[0] === "v" && ID.test(p[1] || "") && req.method === "DELETE") {
        const head = await env.SHARES.head(`v/${p[1]}`);
        if (!head) return new Response(null, { status: 204, headers: h });
        if (head.customMetadata?.del !== (await sha(req.headers.get("X-Delete-Key") || ""))) return fail("This delete key does not match.", 403, h);
        await env.SHARES.delete(`v/${p[1]}`);
        return new Response(null, { status: 204, headers: h });
      }

      // ---- the watch page ----
      if (p[0] === "v" && ID.test(p[1] || "") && req.method === "GET") {
        const head = await env.SHARES.head(`v/${p[1]}`);
        const gone = !head || expired(head.customMetadata);
        return new Response(page(p[1], gone, head?.customMetadata?.expires), {
          status: gone ? 404 : 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow",
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; media-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
          },
        });
      }
      if (p.length === 0) return Response.redirect("https://tools.clientorahq.com/screen-recorder", 302);
      return new Response("Not found.", { status: 404 });
    } catch (e) {
      return fail(`The share server had a problem (${(e as Error).message || "unknown"}). Press Retry.`, 500, h);
    }
  },
};

function page(id: string, gone: boolean, expires?: string) {
  const until = expires ? new Date(expires).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  const body = gone
    ? `<div class="box"><h1>This video is not here any more</h1><p>It was deleted by the person who shared it, or the link expired (links last ${DAYS} days).</p></div>`
    : `<video src="/f/${id}" controls playsinline preload="metadata"></video>
       <div class="bar"><span>Shared screen recording · link works until ${esc(until)}</span>
       <span><button id="copy" type="button">Copy link</button> <a class="btn" href="/f/${id}?download">Download</a></span></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${gone ? "Video not found" : "Screen recording"} · ClientoraHQ</title>
<style>
:root{color-scheme:dark;--bg:#02060C;--card:#071423;--line:#123247;--fg:#E6F8FF;--fg2:#A7C6D6;--cyan:#29E6FF}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:1100px;margin:0 auto;padding:20px 16px 40px}header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}
.logo{font-weight:900;letter-spacing:1px;color:var(--fg);text-decoration:none}.logo b{color:var(--cyan)}
video{width:100%;max-height:75vh;background:#000;border-radius:14px;border:1px solid var(--line);display:block}
.bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;color:var(--fg2);font-size:14px}
button,.btn{font:inherit;font-weight:700;font-size:14px;padding:9px 14px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer;text-decoration:none;display:inline-block}
.cta{margin-top:28px;padding:20px;border-radius:16px;background:var(--card);border:1px solid var(--line)}.cta a{color:var(--cyan);font-weight:700}
.box{padding:40px 20px;text-align:center;background:var(--card);border-radius:16px;border:1px solid var(--line)}
small{display:block;margin-top:22px;color:var(--fg2);font-size:12.5px}
</style></head><body><main>
<header><a class="logo" href="https://tools.clientorahq.com/">CLIENTORA<b>HQ</b> FREE TOOLS</a><a class="btn" href="https://tools.clientorahq.com/screen-recorder">Record your own, free</a></header>
${body}
<div class="cta">Made with the free <a href="https://tools.clientorahq.com/screen-recorder">ClientoraHQ Screen Recorder</a>: no sign-up, no watermark, with your voice and camera. Freelancer or agency? <a href="https://clientorahq.com/">ClientoraHQ finds clients who are asking right now.</a></div>
<small>This video was shared by a visitor; ClientoraHQ does not check it. To report a video, email hello@clientorahq.com with this link.</small>
</main>
<script>var c=document.getElementById("copy");if(c)c.onclick=function(){navigator.clipboard.writeText(location.href).then(function(){c.textContent="Copied"},function(){c.textContent="Copy failed: copy from the address bar"})}</script>
</body></html>`;
}
