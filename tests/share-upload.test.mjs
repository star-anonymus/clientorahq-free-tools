// The Screen Recorder's share-link upload (lib/shareUpload.ts): progress, retries, visible errors, resume. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { MIN_PART, UploadError, partSizeFor, uploadShare } from "../lib/shareUpload.ts";

const MiB = 1024 * 1024;
const SERVER_PART = 50 * MiB;

/** A fake share server. `failPut(n, attempt)` may return an UploadError to throw for that try. */
function fakeNet({ failPut } = {}) {
  const log = { calls: [], puts: [], waits: [] };
  const tries = {};
  return {
    log,
    net: {
      async call(path, init) {
        log.calls.push(path);
        if (path === "/upload/start") return { id: "abcdefghijkl", uploadId: "U", partSize: SERVER_PART, deleteKey: "k" };
        if (path.includes("/done")) { log.doneBody = JSON.parse(init.body); return { url: "https://share.example/v/abcdefghijkl" }; }
        throw new Error("unexpected " + path);
      },
      async put(path, body, onBytes) {
        const n = Number(path.split("/")[3].split("?")[0]);
        tries[n] = (tries[n] || 0) + 1;
        const e = failPut?.(n, tries[n]);
        if (e) throw e;
        onBytes(Math.floor(body.size / 2));
        onBytes(body.size);
        log.puts.push({ n, size: body.size });
        return { etag: "e" + n };
      },
      async wait(ms) { log.waits.push(ms); },
    },
  };
}

const video = (bytes) => new Blob([new Uint8Array(bytes)], { type: "video/mp4" });

test("part size: at least 8 MiB, never above the server's limit, bigger for big videos", () => {
  assert.equal(partSizeFor(15e6, SERVER_PART), MIN_PART);
  assert.equal(partSizeFor(1024 * MiB, SERVER_PART), 32 * MiB);
  assert.equal(partSizeFor(5000 * MiB, SERVER_PART), SERVER_PART);
});

test("a 15 MB recording goes up in parts and the bar moves before the end", async () => {
  const { net, log } = fakeNet();
  const seen = [];
  const r = await uploadShare(video(15_000_000), { net, signal: new AbortController().signal, onProgress: (p) => seen.push(p.pct) });
  assert.equal(r.url, "https://share.example/v/abcdefghijkl");
  assert.deepEqual(log.puts.map((p) => p.n), [1, 2]);
  assert.equal(log.puts[0].size, 8 * MiB);
  assert.deepEqual(log.doneBody.parts, [{ n: 1, etag: "e1" }, { n: 2, etag: "e2" }]);
  assert.ok(seen.some((p) => p > 0 && p < 50), "progress shows inside the first part");
  assert.equal(seen.at(-1), 100);
  assert.ok(seen.slice(0, -1).every((p) => p <= 99), "100% only once the link exists");
});

test("a dropped part is tried again and the reason is shown while it waits", async () => {
  const { net, log } = fakeNet({ failPut: (n, t) => (n === 2 && t === 1 ? new UploadError("The connection to the share server dropped.") : null) });
  const notes = [];
  await uploadShare(video(15_000_000), { net, signal: new AbortController().signal, onProgress: (p) => p.retrying && notes.push(p.retrying) });
  assert.equal(log.waits.length, 1);
  assert.match(notes[0], /dropped.*Trying again \(2\/3\)/);
});

test("after 3 failed tries it stops with the reason (no endless 0%)", async () => {
  const { net, log } = fakeNet({ failPut: () => new UploadError("Nothing was sent for 45 seconds: the connection is too slow or stopped.") });
  await assert.rejects(uploadShare(video(15_000_000), { net, signal: new AbortController().signal, onProgress() {} }), /Nothing was sent for 45 seconds/);
  assert.equal(log.waits.length, 2);
  assert.ok(!log.calls.some((c) => c.includes("/done")));
});

test("a refused part (4xx) is not retried; a rate limit (429) waits longer", async () => {
  const a = fakeNet({ failPut: () => new UploadError("Upload part is too big.", 413) });
  await assert.rejects(uploadShare(video(15_000_000), { net: a.net, signal: new AbortController().signal, onProgress() {} }), /too big/);
  assert.equal(a.log.waits.length, 0);
  const b = fakeNet({ failPut: (n, t) => (t === 1 ? new UploadError("Too many uploads right now.", 429) : null) });
  await uploadShare(video(15_000_000), { net: b.net, signal: new AbortController().signal, onProgress() {} });
  assert.equal(b.log.waits[0], 20_000);
});

test("Retry carries on from the parts already sent", async () => {
  let down = true;
  const { net, log } = fakeNet({ failPut: (n) => (n === 2 && down ? new UploadError("dropped") : null) });
  let session = null;
  const blob = video(15_000_000);
  await assert.rejects(uploadShare(blob, { net, signal: new AbortController().signal, onProgress() {}, onSession: (s) => (session = s) }));
  down = false;
  await uploadShare(blob, { net, signal: new AbortController().signal, onProgress() {}, session });
  assert.equal(log.calls.filter((c) => c === "/upload/start").length, 1, "no second start");
  assert.deepEqual(log.puts.map((p) => p.n), [1, 2], "part 1 is not sent twice");
});

test("Cancel stops it with a clear message", async () => {
  const ac = new AbortController();
  const { net } = fakeNet({ failPut: () => { ac.abort(); return new UploadError("Upload cancelled."); } });
  await assert.rejects(uploadShare(video(15_000_000), { net, signal: ac.signal, onProgress() {} }), /Upload cancelled/);
});
