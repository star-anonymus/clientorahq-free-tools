// Upload for the Screen Recorder's share link (share-worker/: Cloudflare Worker + R2).
// - The video goes up in parts with XMLHttpRequest, so the bar moves with every byte sent (fetch has no upload
//   progress, and a 15 MB video used to be one part: the bar sat at 0% until the very end).
// - No silent hangs: every request has a timeout, and a part that sends nothing for STALL_MS is stopped.
//   Each part is tried 3 times; after that the visitor sees the reason and a Retry button.
// - Retry carries on from the parts already sent (the server keeps an unfinished upload for a day).
// Plain functions with the network passed in, so tests/share-upload.test.mjs can run them in Node.

export const SHARE_URL = (process.env.NEXT_PUBLIC_SHARE_URL || "https://share.clientorahq.com").replace(/\/$/, "");

const MiB = 1024 * 1024;
/** R2 needs every part but the last to be at least 5 MiB and all the same size. */
export const MIN_PART = 8 * MiB;
/** Aim for at most this many parts, so a big video stays under the server's per-minute request limit. */
const TARGET_PARTS = 32;
/** A part that sends no bytes for this long is stopped and tried again. */
export const STALL_MS = 45_000;
/** Start and finish calls are small: they must answer within this time. */
export const CALL_MS = 30_000;
const TRIES = 3;

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.name = "UploadError"; this.status = status; }
}

/** Part size for a video: at least MIN_PART, at most what the server allows, whole MiB. */
export function partSizeFor(size: number, serverMax: number): number {
  const want = Math.ceil(size / TARGET_PARTS / MiB) * MiB;
  return Math.max(Math.min(MIN_PART, serverMax), Math.min(want, serverMax));
}

export type Started = { id: string; uploadId: string; partSize: number; deleteKey: string };
export type Session = Started & { size: number; done: { n: number; etag: string }[] };

export interface Net {
  /** JSON call to the share server; rejects with UploadError (reason in the message). */
  call<T>(path: string, init: { method: string; body?: string }): Promise<T>;
  /** Sends one part; onBytes(sent) as bytes go out. Rejects with UploadError. */
  put(path: string, body: Blob, onBytes: (sent: number) => void, signal: AbortSignal): Promise<{ etag: string }>;
  wait(ms: number): Promise<void>;
}

export interface Progress { sent: number; total: number; pct: number; part: number; parts: number; retrying?: string }

/**
 * Uploads `blob` and returns the share link. Pass the same `session` object back in on Retry to continue
 * where it stopped. `signal` cancels it (rejects with UploadError "Upload cancelled.").
 */
export async function uploadShare(
  blob: Blob,
  opts: { net: Net; onProgress: (p: Progress) => void; signal: AbortSignal; session?: Session | null; onSession?: (s: Session) => void },
): Promise<{ url: string; session: Session }> {
  const { net, onProgress, signal } = opts;
  const cancelled = () => { if (signal.aborted) throw new UploadError("Upload cancelled."); };

  let s = opts.session && opts.session.size === blob.size ? opts.session : null;
  if (!s) {
    const st = await net.call<Started>("/upload/start", { method: "POST", body: JSON.stringify({ type: blob.type, size: blob.size }) });
    s = { ...st, partSize: partSizeFor(blob.size, st.partSize), size: blob.size, done: [] };
    opts.onSession?.(s);
  }
  const total = blob.size;
  const parts = Math.max(1, Math.ceil(total / s.partSize));
  const sentBefore = (n: number) => Math.min(total, (n - 1) * s!.partSize);
  const report = (part: number, sent: number, retrying?: string) =>
    onProgress({ sent, total, pct: Math.min(99, Math.floor((sent / total) * 100)), part, parts, retrying });

  for (let n = 1; n <= parts; n++) {
    cancelled();
    if (s.done.some((d) => d.n === n)) continue;
    const piece = blob.slice((n - 1) * s.partSize, n * s.partSize);
    let last: UploadError | null = null;
    for (let attempt = 1; attempt <= TRIES; attempt++) {
      cancelled();
      report(n, sentBefore(n), last ? `${last.message} Trying again (${attempt}/${TRIES})…` : undefined);
      try {
        const r = await net.put(`/upload/${s.id}/${n}?u=${encodeURIComponent(s.uploadId)}`, piece, (b) => report(n, sentBefore(n) + b), signal);
        s.done.push({ n, etag: r.etag });
        last = null;
        break;
      } catch (e) {
        cancelled();
        last = e instanceof UploadError ? e : new UploadError((e as Error)?.message || "The upload stopped.");
        if (last.status >= 400 && last.status < 500 && last.status !== 408 && last.status !== 429) break; // will not get better
        if (attempt < TRIES) await net.wait(last.status === 429 ? 20_000 : 2_000 * attempt);
      }
    }
    if (last) throw last;
    report(n, sentBefore(n + 1));
  }
  cancelled();
  const done = await net.call<{ url: string }>(`/upload/${s.id}/done?u=${encodeURIComponent(s.uploadId)}`, {
    method: "POST", body: JSON.stringify({ parts: [...s.done].sort((a, b) => a.n - b.n) }),
  });
  onProgress({ sent: total, total, pct: 100, part: parts, parts });
  return { url: done.url, session: s };
}

const reason = (status: number, data: unknown) =>
  (data as { error?: string } | null)?.error || `The share server answered ${status}.`;

/** The browser's network: fetch with a timeout for calls, XMLHttpRequest with progress and a stall timer for parts. */
export function browserNet(base = SHARE_URL): Net {
  return {
    async call<T>(path: string, init: { method: string; body?: string }) {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), CALL_MS);
      let r: Response;
      try {
        r = await fetch(base + path, { ...init, headers: init.body ? { "Content-Type": "application/json" } : undefined, signal: ac.signal });
      } catch {
        throw new UploadError(ac.signal.aborted ? "The share server did not answer in 30 seconds." : "Could not reach the share server. Check your internet.");
      } finally { clearTimeout(t); }
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new UploadError(reason(r.status, data), r.status);
      return data as T;
    },
    put(path, body, onBytes, signal) {
      return new Promise((resolve, reject) => {
        const x = new XMLHttpRequest();
        let stalled = false;
        let timer: ReturnType<typeof setTimeout>;
        const arm = () => { clearTimeout(timer); timer = setTimeout(() => { stalled = true; x.abort(); }, STALL_MS); };
        const onAbort = () => x.abort();
        const end = () => { clearTimeout(timer); signal.removeEventListener("abort", onAbort); };
        x.open("PUT", base + path);
        x.upload.onprogress = (e) => { arm(); onBytes(e.loaded); };
        x.onload = () => {
          end();
          let data: unknown = null;
          try { data = JSON.parse(x.responseText); } catch { /* not JSON */ }
          if (x.status >= 200 && x.status < 300 && (data as { etag?: string } | null)?.etag) resolve(data as { etag: string });
          else reject(new UploadError(reason(x.status, data), x.status));
        };
        x.onerror = () => { end(); reject(new UploadError("The connection to the share server dropped.")); };
        x.onabort = () => {
          end();
          reject(new UploadError(stalled ? `Nothing was sent for ${STALL_MS / 1000} seconds: the connection is too slow or stopped.` : "Upload cancelled."));
        };
        signal.addEventListener("abort", onAbort);
        arm();
        x.send(body);
      });
    },
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
  };
}
