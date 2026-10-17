// Renders the ClientoraHQ Free Tools ads: 3 angles × 3 sizes → PNG files next to this script.
// Run: node marketing/ads/render-ads.mjs   (uses the Playwright install in E:\Shehryar_Lead_Generator, one Edge launch)
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire("E:/Shehryar_Lead_Generator/package.json");
const { chromium } = require("playwright");
const OUT = path.dirname(fileURLToPath(import.meta.url));

const SIZES = [
  { key: "feed", w: 1080, h: 1080 },
  { key: "story", w: 1080, h: 1920 },
  { key: "linkedin", w: 1200, h: 627 },
];

// Simple line icons (24×24, stroke = currentColor)
const P = {
  merge: '<path d="M8 3v6a4 4 0 0 0 4 4h0a4 4 0 0 1 4 4v4"/><path d="M16 3v6a4 4 0 0 1-4 4"/><path d="m13 18 3 3 3-3"/>',
  split: '<path d="M12 3v6"/><path d="M12 9 6 15v6"/><path d="m12 9 6 6v6"/>',
  compress: '<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="m14 10 7-7"/><path d="m3 21 7-7"/>',
  sign: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  word: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m8 13 1.5 5 2.5-4 2.5 4L16 13"/>',
  invoice: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-1 .7-3-2-3 2-3-2-3 2Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  resume: '<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="9" r="3"/><path d="M8 17c.8-2 2.2-3 4-3s3.2 1 4 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  record: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/><circle cx="9.5" cy="12" r="2.5" fill="currentColor"/>',
  letter: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.5" fill="currentColor"/>',
  laptop: '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
};
const icon = (k, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;

const MARK = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="#031421" stroke="#29e6ff" stroke-width="1.5" stroke-dasharray="5 2.5"/><circle cx="20" cy="20" r="14" fill="none" stroke="#29e6ff" stroke-width="1" opacity=".5"/><text x="20" y="27.5" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="900" font-size="21" fill="#7df3ff">C</text></svg>`;
const LOGO = `<div class="logo">${MARK}<div><b>CLIENTORA<span class="hq">HQ</span></b><small>FREE TOOLS</small></div></div>`;
const BADGES = `<div class="badges">${["Free", "No upload", "No sign-up", "No daily limits"].map((b) => `<span>${icon("check")}${b}</span>`).join("")}</div>`;
const CTA = (label) => `<div class="cta-row"><span class="cta">${label} ${icon("arrow")}</span><span class="url">tools.clientorahq.com</span></div>`;
const tile = (k, name, sub) => `<div class="tile"><span class="ti">${icon(k)}</span><div><b>${name}</b><small>${sub}</small></div></div>`;

const ANGLES = {
  pdf: {
    kicker: "Free PDF tools",
    h: 'PDF tools that don\'t stop you <span class="cy">after 2 files.</span>',
    sub: "Merge, split, compress, sign and convert PDFs — free, with no daily limit and no watermark.",
    visual: `<div class="compare"><div class="them">${icon("x")}<span>Many PDF sites</span><b>Daily limits, then pay</b></div><div class="us">${icon("check")}<span>ClientoraHQ Free Tools</span><b>Unlimited · free</b></div></div>
      <div class="tiles">${tile("merge", "Merge PDF", "Combine files")}${tile("split", "Split PDF", "Pull out pages")}${tile("compress", "Compress PDF", "Smaller files")}${tile("sign", "Sign PDF", "Draw or type")}${tile("word", "PDF to Word", "Editable .docx")}${tile("rotate", "Rotate PDF", "Fix the pages")}</div>`,
    cta: "Merge a PDF free",
  },
  kit: {
    kicker: "Free freelancer kit",
    h: 'Your freelance toolkit. <span class="cy">Free.</span>',
    sub: "Invoices, resumes, cover letters, time tracking — and a screen recorder with no time limit.",
    visual: `<div class="tiles">${tile("invoice", "Invoice Generator", "No watermark")}${tile("resume", "Resume Builder", "Clean PDF resume")}${tile("letter", "Cover Letter", "Tailored in a minute")}${tile("clock", "Time Tracker", "Hours per client")}${tile("record", "Screen Recorder", "No time limit")}${tile("sign", "Sign PDF", "Sign contracts")}</div>`,
    cta: "Get the free kit",
  },
  privacy: {
    kicker: "30 free tools",
    h: 'Your files <span class="cy">never leave</span> your laptop.',
    sub: "PDF, image and business tools that run inside your browser. Nothing is uploaded — safe for contracts, ID cards and client work.",
    visual: `<div class="vault"><div class="ring">${icon("laptop", "big")}<span class="lockb">${icon("lock")}</span></div><div class="meter"><span>Uploaded to a server</span><b>0 bytes</b></div></div>`,
    cta: "Try 30 free tools",
  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#02060c}
.ad{position:relative;overflow:hidden;color:#e7f6fb;font-family:Inter,system-ui,sans-serif;background:
 radial-gradient(60% 50% at 85% 0%,rgba(41,230,255,.20),transparent 70%),
 radial-gradient(50% 40% at 0% 100%,rgba(41,230,255,.10),transparent 70%),#02060c}
.ad::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(41,230,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(41,230,255,.06) 1px,transparent 1px);background-size:54px 54px;mask-image:radial-gradient(80% 70% at 50% 40%,#000,transparent)}
.in{position:relative;height:100%;display:flex;flex-direction:column}
.logo{display:flex;align-items:center;gap:14px}.logo .mark{width:62px;height:62px}
.logo b{font-family:Orbitron,sans-serif;font-weight:900;letter-spacing:.14em;font-size:26px;color:#e7f6fb;display:block}
.logo .hq{margin-left:8px;padding:1px 7px;border:2px solid #29e6ff;border-radius:6px;font-size:16px;color:#29e6ff;vertical-align:3px}
.logo small{display:block;font-family:Orbitron,sans-serif;letter-spacing:.32em;font-size:12px;color:#7fb3c2;margin-top:4px}
.kicker{font-family:Orbitron,sans-serif;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#29e6ff;font-size:20px}
h1{font-weight:800;letter-spacing:-.025em;line-height:1.04;color:#fff}
.cy{color:#29e6ff;text-shadow:0 0 28px rgba(41,230,255,.45)}
.sub{color:#b6cdd6;line-height:1.38;font-weight:500}
.badges{display:flex;flex-wrap:wrap;gap:10px}
.badges span{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border:1px solid rgba(61,255,168,.35);border-radius:999px;color:#7dffc4;font-weight:600;font-size:19px;background:rgba(61,255,168,.06)}
.badges .ic{width:18px;height:18px}
.cta-row{display:flex;align-items:center;gap:22px}
.cta{display:inline-flex;align-items:center;gap:12px;background:#29e6ff;color:#02141c;font-weight:800;border-radius:14px;padding:20px 30px;font-size:28px;box-shadow:0 0 40px rgba(41,230,255,.35)}
.cta .ic{width:28px;height:28px;stroke-width:2.6}
.url{color:#9fd8e6;font-weight:600;font-size:24px;letter-spacing:.01em}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.tile{display:flex;align-items:center;gap:14px;padding:18px;border:1px solid rgba(41,230,255,.22);border-radius:16px;background:linear-gradient(180deg,rgba(9,28,40,.85),rgba(4,14,22,.85))}
.ti{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:12px;background:rgba(41,230,255,.10);border:1px solid rgba(41,230,255,.35);color:#29e6ff}
.ti .ic{width:28px;height:28px}
.tile b{display:block;font-size:21px;color:#fff;font-weight:700}
.tile small{display:block;font-size:16px;color:#8fb2bf;margin-top:3px}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.compare>div{border-radius:16px;padding:20px 22px;display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:center}
.compare .ic{grid-row:span 2;width:34px;height:34px}
.compare span{font-size:18px;color:#9db6c0;font-weight:600}.compare b{font-size:24px;font-weight:800}
.them{border:1px solid rgba(255,107,107,.35);background:rgba(255,107,107,.06)}.them .ic{color:#ff7b7b}.them b{color:#ffb3b3}
.us{border:1px solid rgba(41,230,255,.5);background:rgba(41,230,255,.08)}.us .ic{color:#29e6ff}.us b{color:#fff}
.vault{display:flex;flex-direction:column;align-items:center;gap:26px}
.ring{position:relative;width:300px;height:300px;border-radius:50%;display:grid;place-items:center;border:2px dashed rgba(41,230,255,.55);box-shadow:0 0 80px rgba(41,230,255,.18) inset,0 0 60px rgba(41,230,255,.15);background:radial-gradient(circle,rgba(41,230,255,.10),transparent 65%)}
.ring::after{content:"";position:absolute;inset:26px;border-radius:50%;border:1px solid rgba(41,230,255,.3)}
.ic.big{width:150px;height:150px;color:#7df3ff;stroke-width:1.3}
.lockb{position:absolute;right:42px;bottom:46px;width:74px;height:74px;border-radius:50%;display:grid;place-items:center;background:#29e6ff;color:#02141c;box-shadow:0 0 30px rgba(41,230,255,.6)}
.lockb .ic{width:40px;height:40px;stroke-width:2.2}
.meter{display:flex;align-items:center;gap:18px;padding:14px 24px;border-radius:14px;border:1px solid rgba(61,255,168,.4);background:rgba(61,255,168,.06)}
.meter span{color:#9db6c0;font-size:21px;font-weight:600}.meter b{font-family:Orbitron,sans-serif;color:#7dffc4;font-size:30px}

/* feed 1080×1080 */
.feed .in{padding:72px 76px;gap:30px}.feed h1{font-size:76px}.feed .sub{font-size:28px;max-width:880px}
.feed .push{margin-top:auto}
.feed .ring{width:230px;height:230px}.feed .ic.big{width:112px;height:112px}.feed .lockb{width:58px;height:58px;right:28px;bottom:32px}.feed .lockb .ic{width:30px;height:30px}.feed .vault{gap:18px}.feed .meter{padding:10px 20px}.feed .meter b{font-size:26px}
.feed.kit .tiles{gap:18px}.feed.kit .tile{padding:28px 18px}
/* story 1080×1920: content inside the 1080×1420 safe area (top 250, bottom 250 kept clear) */
.story .in{padding:250px 80px 250px;gap:40px}.story h1{font-size:96px}.story .sub{font-size:34px}
.story .tiles{grid-template-columns:1fr 1fr;gap:18px}.story .tile{padding:24px}.story .tile b{font-size:25px}.story .tile small{font-size:19px}
.story .push{margin-top:auto}
.story .ti{width:68px;height:68px}.story .ti .ic{width:36px;height:36px}.story.kit .tile,.story.pdf .tile{padding:36px 24px}.story .compare b{font-size:30px}.story .compare span{font-size:22px}.story .compare>div{padding:26px}.story .badges span{font-size:22px;padding:11px 16px}.story .ring{width:420px;height:420px}.story .ic.big{width:210px;height:210px}
.story .compare{grid-template-columns:1fr}
/* linkedin 1200×627 */
.linkedin .in{flex-direction:row;padding:54px 60px;gap:44px}
.linkedin .col{flex:1.15;display:flex;flex-direction:column;gap:20px}.linkedin .side{flex:1;display:flex;flex-direction:column;justify-content:center}
.linkedin h1{font-size:54px}.linkedin .sub{font-size:22px}.linkedin .logo .mark{width:48px;height:48px}.linkedin .logo b{font-size:21px}
.linkedin .kicker{font-size:16px}.linkedin .cta{font-size:22px;padding:15px 22px}.linkedin .url{font-size:19px}.linkedin .push{margin-top:auto}
.linkedin .tiles{grid-template-columns:1fr 1fr;gap:12px}.linkedin .tile{padding:12px;gap:10px}.linkedin .ti{width:40px;height:40px}.linkedin .ti .ic{width:22px;height:22px}
.linkedin .tile b{font-size:17px}.linkedin .tile small{font-size:13px}.linkedin .badges span{font-size:15px;padding:6px 11px}
.linkedin .compare{grid-template-columns:1fr;gap:10px;margin-bottom:12px}.linkedin .compare>div{padding:12px 16px}.linkedin .compare b{font-size:19px}.linkedin .compare span{font-size:14px}
.linkedin .ring{width:250px;height:250px}.linkedin .ic.big{width:120px;height:120px}.linkedin .lockb{width:60px;height:60px;right:30px;bottom:34px}.linkedin .meter b{font-size:24px}.linkedin .meter span{font-size:17px}
.linkedin .vault{gap:18px}
`;

function page(angle, size) {
  const a = ANGLES[angle];
  const head = `${LOGO}<p class="kicker">${a.kicker}</p><h1>${a.h}</h1><p class="sub">${a.sub}</p>`;
  const body =
    size.key === "linkedin"
      ? `<div class="col">${head}<div class="push">${CTA(a.cta)}</div></div><div class="side">${a.visual}</div>`
      : `${head}${a.visual}<div class="push" style="display:flex;flex-direction:column;gap:26px">${BADGES}${CTA(a.cta)}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="ad ${size.key} ${angle}" style="width:${size.w}px;height:${size.h}px"><div class="in">${body}</div></div></body></html>`;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const made = [];
try {
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  for (const angle of Object.keys(ANGLES)) {
    for (const size of SIZES) {
      const html = page(angle, size);
      writeFileSync(path.join(OUT, "src", `${angle}-${size.w}x${size.h}.html`), html);
      await pg.setViewportSize({ width: size.w, height: size.h });
      await pg.setContent(html, { waitUntil: "networkidle" });
      await pg.evaluate(() => document.fonts.ready);
      // Nothing may spill out of the canvas
      const spill = await pg.evaluate(() => {
        const box = document.querySelector(".ad").getBoundingClientRect();
        return [...document.querySelectorAll(".ad *")].some((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > box.right + 1 || r.bottom > box.bottom + 1); });
      });
      const file = path.join(OUT, `${angle}-${size.w}x${size.h}.png`);
      await pg.locator(".ad").screenshot({ path: file });
      made.push(`${path.basename(file)}${spill ? "  ⚠ content spills out" : ""}`);
    }
  }
} finally {
  await browser.close();
}
console.log(made.join("\n"));
