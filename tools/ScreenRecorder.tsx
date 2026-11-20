"use client";
import { useEffect, useRef, useState } from "react";
import { Circle, Copy, Download, ExternalLink, Link2, Mic, MonitorUp, Pause, Play, Square, Trash2, Video, Volume2, RotateCcw } from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/files";
import { toast } from "@/lib/toast";

type State = "idle" | "countdown" | "recording" | "paused" | "done";

function pickMime() {
  const list = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return list.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) ?? "";
}

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ""}${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

// Loom-style share links: share-worker/ (Cloudflare Worker + R2) stores the video for 30 days.
const SHARE_URL = (process.env.NEXT_PUBLIC_SHARE_URL || "https://share.clientorahq.com").replace(/\/$/, "");

async function api<T>(path: string, init: RequestInit): Promise<T> {
  let r: Response;
  try { r = await fetch(SHARE_URL + path, init); } catch { throw new Error("Could not reach the share server. Check your internet and press Retry."); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error || `The share server answered ${r.status}. Press Retry.`);
  return data as T;
}

type Shared = { id: string; url: string; deleteKey: string };

function ShareBox({ blob }: { blob: Blob }) {
  const [step, setStep] = useState<"ask" | "uploading" | "done" | "error" | "deleted">("ask");
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const [shared, setShared] = useState<Shared | null>(null);
  const [copied, setCopied] = useState(false);

  const upload = async () => {
    setStep("uploading"); setPct(0); setErr("");
    try {
      const s = await api<{ id: string; uploadId: string; partSize: number; deleteKey: string }>("/upload/start", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: blob.type, size: blob.size }),
      });
      const parts: { n: number; etag: string }[] = [];
      const total = Math.ceil(blob.size / s.partSize);
      for (let i = 0; i < total; i++) {
        const piece = blob.slice(i * s.partSize, (i + 1) * s.partSize);
        let last: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const r = await api<{ etag: string }>(`/upload/${s.id}/${i + 1}?u=${encodeURIComponent(s.uploadId)}`, { method: "PUT", body: piece });
            parts.push({ n: i + 1, etag: r.etag }); last = null; break;
          } catch (e) { last = e; await new Promise((res) => setTimeout(res, 1500 * (attempt + 1))); }
        }
        if (last) throw last;
        setPct(Math.round(((i + 1) / total) * 100));
      }
      const done = await api<{ url: string }>(`/upload/${s.id}/done?u=${encodeURIComponent(s.uploadId)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parts }),
      });
      const sh = { id: s.id, url: done.url, deleteKey: s.deleteKey };
      setShared(sh);
      try { const all = JSON.parse(localStorage.getItem("chq-shares") || "{}"); all[s.id] = s.deleteKey; localStorage.setItem("chq-shares", JSON.stringify(all)); } catch { /* the delete button still works on this page */ }
      setStep("done");
    } catch (e) { setErr((e as Error).message || "Upload failed. Press Retry."); setStep("error"); }
  };

  const remove = async () => {
    if (!shared) return;
    try {
      const r = await fetch(`${SHARE_URL}/v/${shared.id}`, { method: "DELETE", headers: { "X-Delete-Key": shared.deleteKey } });
      if (!r.ok && r.status !== 204) throw new Error();
      setStep("deleted");
    } catch { toast.error("Could not delete the link. Check your internet and try again."); }
  };

  const copy = () => navigator.clipboard.writeText(shared!.url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }, () => toast.error("Copy failed: select the link and copy it."));

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-bg-2/40 p-5 text-center">
      {step === "ask" && (<>
        <p className="text-[16px] font-bold"><Link2 size={18} className="mr-1 inline" aria-hidden="true" /> Share it like a Loom video</p>
        <p className="mt-1 text-[13.5px] text-fg-2">This uploads the video ({formatBytes(blob.size)}) to ClientoraHQ's share server. Anyone with the link can watch it for 30 days, then it is deleted. Up to 1 GB.</p>
        <button type="button" className="btn btn-primary mt-3" onClick={upload}><Link2 size={18} /> Get share link</button>
      </>)}
      {step === "uploading" && (<>
        <p className="font-bold">Uploading… {pct}%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-cyan transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-[13px] text-fg-3">Keep this tab open until it finishes.</p>
      </>)}
      {step === "error" && (<>
        <p className="font-bold text-bad">Share link not made</p>
        <p className="mt-1 text-[14px] text-fg-2">{err}</p>
        <button type="button" className="btn btn-primary mt-3" onClick={upload}><RotateCcw size={16} /> Retry</button>
      </>)}
      {step === "done" && shared && (<>
        <p className="font-bold text-ok">Your share link is ready</p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={shared.url} onFocus={(e) => e.currentTarget.select()} className="input min-w-0 flex-1" aria-label="Share link" />
          <button type="button" className="btn btn-primary" onClick={copy}><Copy size={16} /> {copied ? "Copied" : "Copy"}</button>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-[14px]">
          <a className="btn btn-ghost" href={shared.url} target="_blank" rel="noopener"><ExternalLink size={16} /> Open</a>
          <a className="btn btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(shared.url)}`} target="_blank" rel="noopener">Send on WhatsApp</a>
          <button type="button" className="btn btn-ghost" onClick={remove}><Trash2 size={16} /> Delete link</button>
        </div>
        <p className="mt-2 text-[12.5px] text-fg-3">Works for 30 days. Only people you send it to can find it.</p>
      </>)}
      {step === "deleted" && <p className="font-bold">The link was deleted. Nobody can watch the video any more.</p>}
    </div>
  );
}

export default function ScreenRecorder() {
  const [supported, setSupported] = useState(true);
  const [mic, setMic] = useState(true);
  const [sysAudio, setSysAudio] = useState(true);
  const [cam, setCam] = useState(false);
  const [countdown, setCountdown] = useState(true);
  const [state, setState] = useState<State>("idle");
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; url: string; ms: number; ext: string } | null>(null);

  const rec = useRef<MediaRecorder | null>(null);
  const streams = useRef<MediaStream[]>([]);
  const chunks = useRef<Blob[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);
  const mixNodes = useRef<AudioNode[]>([]);
  const camVideo = useRef<HTMLVideoElement>(null);
  const timing = useRef({ start: 0, pausedAt: 0, pausedTotal: 0 });

  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getDisplayMedia && typeof MediaRecorder !== "undefined");
    return () => cleanup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state !== "recording") return;
    const t = setInterval(() => setElapsed(Date.now() - timing.current.start - timing.current.pausedTotal), 250);
    return () => clearInterval(t);
  }, [state]);

  function cleanup() {
    streams.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streams.current = [];
    mixNodes.current = [];
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
  }

  const start = async () => {
    // The audio mixer is made here, while the click still counts as a user action. Made later (after the
    // share box), browsers create it "suspended" and the recording's sound comes out silent.
    const ctx = typeof AudioContext !== "undefined" ? new AudioContext() : null;
    audioCtx.current = ctx;
    ctx?.resume().catch(() => {});
    try {
      // Ask for the microphone first: the permission prompt then shows before the share box, not hidden behind it.
      let micStream: MediaStream | null = null;
      if (mic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
          streams.current.push(micStream);
        } catch {
          toast.error("Microphone is blocked. Click the lock icon next to the address bar, allow the microphone, then try again. Recording without it.");
        }
      }

      const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: sysAudio });
      streams.current.push(display);
      const tracks: MediaStreamTrack[] = [...display.getVideoTracks()];

      // Mix microphone and system/tab sound into one track, always through the mixer so both are kept.
      const sources: MediaStream[] = [];
      if (display.getAudioTracks().length) sources.push(new MediaStream(display.getAudioTracks()));
      if (micStream) sources.push(micStream);
      if (sources.length && ctx) {
        if (ctx.state !== "running") await ctx.resume().catch(() => {});
        const dest = ctx.createMediaStreamDestination();
        // Kept on the ref so the browser does not garbage-collect the nodes mid-recording.
        mixNodes.current = sources.map((s) => { const n = ctx.createMediaStreamSource(s); n.connect(dest); return n; });
        tracks.push(...(ctx.state === "running" ? dest.stream.getAudioTracks() : sources.flatMap((s) => s.getAudioTracks()).slice(0, 1)));
      } else if (sources.length) tracks.push(...sources[0].getAudioTracks());
      if (mic && !micStream && !display.getAudioTracks().length) toast.info("This recording has no sound.");

      if (cam && camVideo.current) {
        try {
          const c = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 640 } });
          streams.current.push(c);
          camVideo.current.srcObject = c;
          await camVideo.current.play();
          // A floating window stays on top of everything, so it ends up in the screen recording.
          await camVideo.current.requestPictureInPicture().catch(() => toast.info("Your browser can't float the camera — it shows on this page only."));
        } catch { toast.info("Camera blocked — recording without it."); }
      }

      // If the user presses the browser's own "Stop sharing", finish cleanly.
      display.getVideoTracks()[0].addEventListener("ended", () => stop());

      const go = () => {
        const mimeType = pickMime();
        const r = new MediaRecorder(new MediaStream(tracks), mimeType ? { mimeType, videoBitsPerSecond: 5_000_000 } : undefined);
        chunks.current = [];
        r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
        r.onstop = () => {
          const type = r.mimeType || "video/webm";
          const blob = new Blob(chunks.current, { type });
          const ms = Date.now() - timing.current.start - timing.current.pausedTotal;
          setResult({ blob, url: URL.createObjectURL(blob), ms, ext: type.includes("mp4") ? "mp4" : "webm" });
          setState("done");
          cleanup();
        };
        r.start(1000); // a chunk every second keeps memory steady on long recordings
        rec.current = r;
        timing.current = { start: Date.now(), pausedAt: 0, pausedTotal: 0 };
        setElapsed(0);
        setState("recording");
      };

      if (countdown) {
        setState("countdown");
        for (let n = 3; n > 0; n--) { setCount(n); await new Promise((res) => setTimeout(res, 800)); }
      }
      go();
    } catch (e) {
      cleanup();
      setState("idle");
      if ((e as Error)?.name !== "NotAllowedError") toast.error("Could not start recording.");
    }
  };

  function stop() {
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }
  const pause = () => { rec.current?.pause(); timing.current.pausedAt = Date.now(); setState("paused"); };
  const resume = () => { rec.current?.resume(); timing.current.pausedTotal += Date.now() - timing.current.pausedAt; setState("recording"); };

  if (!supported) {
    return (
      <div className="rounded-2xl border border-warn/30 bg-warn/[0.06] p-6 text-center">
        <MonitorUp size={36} className="mx-auto text-warn" aria-hidden="true" />
        <p className="mt-3 text-[17px] font-bold">Screen recording needs a desktop browser</p>
        <p className="mt-1 text-fg-2">Open this page in Chrome, Edge, Firefox or Opera on a laptop or desktop. Phones don't let web pages record the screen.</p>
      </div>
    );
  }

  if (state === "done" && result) {
    return (
      <div className="space-y-4">
        <video src={result.url} controls className="mx-auto max-h-[480px] w-full rounded-xl bg-black" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <p className="text-[14.5px] text-fg-2">{clock(result.ms)} · {formatBytes(result.blob.size)} · {result.ext.toUpperCase()}</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => downloadBlob(result.blob, `screen-recording-${new Date().toLocaleString("sv").slice(0, 16).replace(/[ :]/g, "-")}.${result.ext}`)}><Download size={20} /> Download video</button>
          <button type="button" className="btn btn-ghost" onClick={() => { URL.revokeObjectURL(result.url); setResult(null); setState("idle"); }}><RotateCcw size={16} /> New recording</button>
        </div>
        {result.ext === "webm" && <p className="text-center text-[13px] text-fg-3">WebM plays in Chrome, Edge, Firefox and VLC, and uploads straight to YouTube and Google Drive.</p>}
        <ShareBox blob={result.blob} />
      </div>
    );
  }

  const live = state === "recording" || state === "paused";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <video ref={camVideo} muted playsInline className={cam && live ? "mx-auto h-40 w-40 rounded-full object-cover" : "hidden"} />
      {state === "countdown" && <p className="py-10 text-center font-brand text-[90px] font-black text-cyan" aria-live="assertive">{count}</p>}

      {live && (
        <div className="flex flex-col items-center gap-5 py-6">
          <p className="flex items-center gap-3 font-mono text-[46px] font-bold tabular-nums" role="timer">
            <span className={`h-4 w-4 rounded-full ${state === "recording" ? "animate-pulse bg-bad" : "bg-warn"}`} aria-hidden="true" />
            {clock(elapsed)}
          </p>
          <p className="text-[14px] text-fg-2">{state === "paused" ? "Paused" : "Recording — you can switch to any window or tab"}</p>
          <div className="flex gap-3">
            {state === "recording"
              ? <button type="button" className="btn btn-ghost btn-lg" onClick={pause}><Pause size={20} /> Pause</button>
              : <button type="button" className="btn btn-ghost btn-lg" onClick={resume}><Play size={20} /> Resume</button>}
            <button type="button" className="btn btn-lg bg-bad text-white hover:bg-bad/90" onClick={stop}><Square size={18} fill="currentColor" /> Stop</button>
          </div>
        </div>
      )}

      {state === "idle" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              [mic, setMic, <Mic key="m" size={20} />, "Microphone", "Talk over your recording"],
              [sysAudio, setSysAudio, <Volume2 key="s" size={20} />, "System / tab sound", "Tick 'Share audio' in the share box"],
              [cam, setCam, <Video key="c" size={20} />, "Camera bubble", "Floats on top while you record your screen"],
              [countdown, setCountdown, <Circle key="d" size={20} />, "3-second countdown", "Time to get ready"],
            ] as const).map(([on, set, icon, title, sub]) => (
              <label key={title} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors ${on ? "border-cyan bg-cyan/[0.06]" : "border-line hover:border-line-hi"}`}>
                <input type="checkbox" className="check" checked={on} onChange={(e) => (set as (v: boolean) => void)(e.target.checked)} />
                <span className={on ? "text-cyan" : "text-fg-3"} aria-hidden="true">{icon}</span>
                <span><b className="block text-[15px]">{title}</b><span className="text-[13px] text-fg-3">{sub}</span></span>
              </label>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-lg w-full" onClick={start}>
            <span className="h-3.5 w-3.5 rounded-full bg-bad" aria-hidden="true" /> Start recording
          </button>
          <p className="text-center text-[13px] text-fg-3">No time limit · no watermark · the video stays on your computer unless you make a share link</p>
        </>
      )}
    </div>
  );
}
