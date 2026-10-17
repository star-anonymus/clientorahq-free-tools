# Deploy — ClientoraHQ Free Tools (tools.clientorahq.com)

Nothing here costs money to run: the site is a static export, there are no server routes, no API keys and no environment variables.

## 1. Push to GitHub (new public repo)

Create an empty **public** repo named `clientorahq-free-tools` under `star-anonymus` on github.com (no README), then:

```bash
cd E:/ClientoraHQ_Free_Tools
git remote add origin https://github.com/star-anonymus/clientorahq-free-tools.git
git push -u origin main
```

Keep the repo **public**: the Background Remover uses `@imgly/background-removal`, which is AGPL-3.0. AGPL lets you use it for free on a public website as long as the site's source code is available to its users — the public repo (linked from the portfolio) covers that. If you ever want the repo private, buy IMG.LY's commercial licence or remove that tool.

## 2. Vercel project

1. vercel.com → Add New → Project → import `star-anonymus/clientorahq-free-tools`.
2. Framework: **Next.js** (auto-detected). Build command and output: leave the defaults. No environment variables.
3. Deploy. Check the `*.vercel.app` URL: open a few tools, merge two PDFs, compress an image.

## 3. Domain: tools.clientorahq.com

In Vercel → Project → Settings → Domains → add `tools.clientorahq.com`. Vercel then shows the record to create. Normally:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `tools` | `cname.vercel-dns.com` |

Add it wherever clientorahq.com's DNS is managed right now (Hostinger, or Cloudflare if the move is done). On Cloudflare set the record to **DNS only** (grey cloud) so Vercel can issue the SSL certificate.

## 4. Portfolio

The portfolio's tool cards (`lib/projects.ts`) already point to `https://tools.clientorahq.com/...` and to the GitHub repo above. Push it once the new site is live, so no card links to a domain that isn't up yet:

```bash
cd "E:/Personal Projects/shehryar-portfolio"
git push
```

## 5. After it is live

- Google Search Console → add `tools.clientorahq.com` → submit `https://tools.clientorahq.com/sitemap.xml`.
- Optional: link to `https://tools.clientorahq.com` from clientorahq.com's header/footer and from `/tools/` so the two tool sets help each other rank.
- The old tool sites (file-converter-inky, textcraft-tools, securepass-tools, unitconvert-tools on Vercel) can stay up for now; later, point each one at the matching new page (a redirect in their `vercel.json`) so existing links and rankings carry over.

## Local commands

```bash
npm run dev                      # http://localhost:4820
npm run build                    # static site in ./out
node scripts/serve-out.mjs 4821  # serve ./out with clean URLs to check the build
```
