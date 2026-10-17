# ClientoraHQ Free Tools

Free PDF, image, text, business and everyday tools at **tools.clientorahq.com** — an iLovePDF / Smallpdf-style hub in ClientoraHQ's look.

**Zero running cost by design.** The site is a static export (`output: "export"`): plain HTML/JS files, no server routes, no API keys, no AI calls. Every tool works inside the visitor's browser (pdf-lib, pdf.js, canvas, MediaRecorder, Web Crypto, localStorage), so a visitor's file never leaves their device.

## Run it

```bash
npm install          # npm cache is pinned to E:\DevCaches\npm-cache by .npmrc
npm run dev          # http://localhost:4820
npm run build        # static site in ./out
```

## Layout

| Path | What |
| --- | --- |
| `lib/tools.ts` | Tool registry: name, category, SEO title/description, steps, FAQ. Add a tool here first. |
| `components/ToolLoader.tsx` | Maps a slug to its lazily loaded tool component (one chunk per tool). |
| `app/[slug]/page.tsx` | Every tool page and category page (`/pdf-tools`…): header, tool, how-to, FAQ, JSON-LD, ClientoraHQ CTA. |
| `tools/*.tsx` | The tools themselves (client components). |
| `components/ui/` | Drop zone, file rows, result panel, toaster, small controls. |
| `lib/` | pdf.js loader, image pipeline, file helpers, random/strength maths. |

## Adding a tool

1. Add an entry to `tools` in `lib/tools.ts` (and an icon to `components/ToolIcon.tsx` if needed).
2. Write `tools/YourTool.tsx` as a default-exported client component.
3. Map the slug in `components/ToolLoader.tsx`.

The page, sitemap entry, structured data and nav links appear automatically.
