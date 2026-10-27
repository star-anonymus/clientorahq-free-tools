# ClientoraHQ Free Tools

Free PDF, image, text, business and everyday tools at **tools.clientorahq.com** — an iLovePDF / Smallpdf-style hub in ClientoraHQ's look.

**Zero running cost by design.** The site is a static export (`output: "export"`): plain HTML/JS files, no server routes, no API keys, no AI calls. Every tool works inside the visitor's browser (pdf-lib, pdf.js, canvas, MediaRecorder, Web Crypto, localStorage), so a visitor's file never leaves their device.

## Run it

```bash
npm install          # npm cache is pinned to E:\DevCaches\npm-cache by .npmrc
npm run dev          # http://localhost:4820
npm run build        # static site in ./out
npm start            # serve ./out on http://localhost:4821
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

A **landing variant** (e.g. `/cv-maker`, which reuses the Resume Builder) goes in `landings` in `lib/tools.ts` with `component` set to the tool slug it reuses. It gets its own page, canonical, FAQ, sitemap entry and footer link, but no duplicate card in the grid. Only add one for a genuinely different search intent.

## Decisions

- **No AI calls.** "AI" tools that would need a paid model are template-based instead: Resume Builder (bullet templates by role) and Cover Letter Generator (structured templates, three tones). The **AI Grammar Checker** from the old roadmap is left out: a grammar checker worth using needs a language model or a server (LanguageTool), and either one costs money per request.
- **Background Remover** runs the IS-Net model in the browser via `@imgly/background-removal`. The model files (~80 MB, cached after the first use) come from IMG.LY's CDN; the photo never leaves the device. That library is **AGPL-3.0**, so keep this repository public (see DEPLOY.md).
- **PDF text** in generated PDFs (invoice, resume, letter, sign) uses the built-in Helvetica font, so only Latin characters print; others become "?". Currency symbols the font can't draw fall back to the currency code (e.g. INR 1,000.00).

See DEPLOY.md for push, Vercel and DNS steps.
