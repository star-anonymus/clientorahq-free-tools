# Share Worker: Loom-style links for the free Screen Recorder

After a recording, the visitor can press **Get share link**. The video is uploaded in 50 MB parts to a Cloudflare R2
bucket and gets an unlisted link `https://share.clientorahq.com/v/<id>` with a watch page (play, seek, Copy link,
Download, and a ClientoraHQ card). Nothing is uploaded unless the visitor presses the button.

- Links last **30 days**, then the video is deleted (the Worker stops serving it and an R2 lifecycle rule removes the file).
- The uploader gets a private delete key, kept in their browser, for the **Delete link** button.
- Up to 1 GB per video. Uploads are accepted only from tools.clientorahq.com (and localhost), with a per-IP limit.
- Watch pages are `noindex` and carry a report line (hello@clientorahq.com).

Cost: R2's free tier covers 10 GB stored and has no download (egress) fees; past that it is about $0.015 per GB a month.

## One-time setup and deploy (owner runs these in Command Prompt)
R2 must be turned on in the Cloudflare dashboard first (R2 Object Storage, once per account).
```
cd C:\ClientoraHQ\ClientoraHQ_Free_Tools\share-worker
npx.cmd wrangler login
npx.cmd wrangler r2 bucket create chq-shares
npx.cmd wrangler r2 bucket lifecycle add chq-shares expire-30-days v/ --expire-days 31 --abort-multipart-days 1 -y
npx.cmd wrangler deploy
```
The `share.clientorahq.com` domain is created by the deploy (clientorahq.com is in the same Cloudflare account).
Check: open https://share.clientorahq.com/ — it should forward to the Screen Recorder page.

Then publish the site (tools.clientorahq.com deploys on `git push`). The site uses `https://share.clientorahq.com` by
default; set `NEXT_PUBLIC_SHARE_URL` only to point it somewhere else.

## Local test
```
npx.cmd wrangler dev --port 8788 --var PUBLIC_URL:http://localhost:8788
```
Typecheck: `npx.cmd wrangler types` once, then `npx.cmd -p typescript tsc -p tsconfig.json`.
