"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquareHeart, Star, X } from "lucide-react";
import { getPending, SAME_USE_MS, sendFeedback, setGateHandler, setPending, type Pending, type Rating } from "@/lib/feedback";
import { toast } from "@/lib/toast";

/**
 * Wraps a tool: after a result it shows the feedback card under the tool, and before the next use it asks the
 * same question in a popup that must be answered or skipped (lib/feedback.ts has the whole flow).
 */
/** Tools whose answer is on screen as you type (no download or copy): a use is a few seconds of real input. */
const LIVE = new Set(["word-counter", "password-strength-checker", "unit-converter", "date-calculator", "bmi-calculator", "pomodoro-timer"]);
const LIVE_MIN_MS = 6000;
const LIVE_QUIET_MS = 3000;

export default function FeedbackHost({ tool, name, children }: { tool: string; name: string; children: React.ReactNode }) {
  const [pending, setPend] = useState<Pending | null>(null);
  const [popup, setPopup] = useState(false);
  const next = useRef<(() => void) | null>(null);

  const ask = useCallback((then?: () => void) => {
    const p = getPending();
    if (!p) return true;
    setPend(p);
    next.current = then ?? null;
    setPopup(true);
    return false;
  }, []);

  useEffect(() => {
    // Opening a tool page with an unanswered question from before: ask first
    const p = getPending();
    if (p) { setPend(p); setPopup(true); }
    setGateHandler(ask);
    const onResult = () => {
      const now = Date.now();
      const p2 = getPending(now);
      if (p2 && isNewUse(p2, now)) { setPend(p2); setPopup(true); return; }
      if (!p2) {
        const fresh = { tool, name, page: location.pathname, at: now };
        setPending(fresh);
        setPend(fresh);
      }
    };
    window.addEventListener("cq-result", onResult);
    return () => { window.removeEventListener("cq-result", onResult); setGateHandler(null); };
  }, [tool, name, ask]);

  const isNewUse = (p: Pending, now = Date.now()) => !(p.tool === tool && now - p.at < SAME_USE_MS);

  // Typing new input after a result is a new use too (read-only result boxes, and fixing the same result
  // within half a minute, are fine)
  const onFocus = (e: React.FocusEvent) => {
    const el = e.target as HTMLElement;
    const editable = (el instanceof HTMLInputElement && !el.readOnly && el.type !== "file") || (el instanceof HTMLTextAreaElement && !el.readOnly) || el.isContentEditable;
    const p = getPending();
    if (editable && p && isNewUse(p) && !ask()) el.blur();
  };

  // Live tools: input over at least 6 seconds, then 3 quiet seconds, counts as a result
  const live = useRef<{ first: number; timer?: ReturnType<typeof setTimeout> }>({ first: 0 });
  useEffect(() => () => clearTimeout(live.current.timer), []);
  const onActivity = () => {
    if (!LIVE.has(tool) || getPending()) return;
    const l = live.current;
    if (!l.first) l.first = Date.now();
    clearTimeout(l.timer);
    l.timer = setTimeout(() => {
      if (Date.now() - l.first >= LIVE_MIN_MS && !getPending()) { l.first = 0; window.dispatchEvent(new Event("cq-result")); }
    }, LIVE_QUIET_MS);
  };

  const done = (sent: boolean) => {
    setPending(null);
    setPend(null);
    setPopup(false);
    if (sent) toast.success("Thank you! Your feedback went to the ClientoraHQ team.");
    const n = next.current;
    next.current = null;
    n?.();
  };

  return (
    <>
      <div onFocusCapture={onFocus} onInputCapture={onActivity} onChangeCapture={onActivity} onClickCapture={onActivity}>{children}</div>
      {pending && !popup && <FeedbackCard pending={pending} onDone={done} />}
      {pending && popup && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="fb-title">
          <div className="w-full max-w-md">
            <FeedbackCard pending={pending} onDone={done} popup />
          </div>
        </div>
      )}
    </>
  );
}

function FeedbackCard({ pending, onDone, popup }: { pending: Pending; onDone: (sent: boolean) => void; popup?: boolean }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (popup) first.current?.focus(); }, [popup]);

  const send = async (r: Rating) => {
    if (r !== "skip" && !rating) { setError("Please pick 1 to 5 stars, or press Skip."); return; }
    setBusy(true);
    setError("");
    try {
      await sendFeedback(pending, r, comment);
      onDone(r !== "skip");
    } catch (e) {
      // A skip is not held up by a failed send: the visitor chose not to answer
      if (r === "skip") { console.warn("tool feedback: skip not recorded", e); onDone(false); return; }
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className={`mx-auto mt-6 max-w-5xl rounded-[18px] border border-line-hi bg-bg-2 p-5 ${popup ? "mt-0 shadow-2xl shadow-black/60" : ""}`} data-feedback-card>
      <div className="flex items-start gap-3">
        <MessageSquareHeart size={22} className="mt-0.5 flex-none text-cyan" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p id={popup ? "fb-title" : undefined} className="text-[17px] font-bold">{popup ? `Before your next one: how was ${pending.name}?` : `How was ${pending.name}?`}</p>
          <p className="mt-0.5 text-[13.5px] text-fg-3">One tap helps us make these free tools better. Your result is ready either way.</p>
        </div>
        {!popup && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => send("skip")} disabled={busy} aria-label="Skip feedback"><X size={15} /></button>
        )}
      </div>
      <div className="mt-4 flex gap-1.5" role="radiogroup" aria-label="Rating from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} ref={n === 1 ? first : undefined} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => { setRating(n); setError(""); }} disabled={busy}
            className="grid h-11 w-11 place-items-center rounded-xl border border-line transition hover:border-cyan">
            <Star size={24} className={n <= rating ? "fill-warn text-warn" : "text-fg-3"} />
          </button>
        ))}
      </div>
      <label className="mt-4 block text-[13.5px] text-fg-2" htmlFor={popup ? "fb-comment-pop" : "fb-comment"}>Anything to add? (optional, please don&apos;t include personal details)</label>
      <textarea id={popup ? "fb-comment-pop" : "fb-comment"} data-feedback-field value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={2} disabled={busy}
        className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2 text-[15px] outline-none focus:border-cyan" placeholder="What worked, what didn't, what tool should we add?" />
      {error && <p className="mt-2 text-[14px] font-semibold text-bad" role="alert">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => send(String(rating) as Rating)} disabled={busy}>{busy ? "Sending…" : error && rating ? "Retry" : "Send feedback"}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => send("skip")} disabled={busy}>Skip</button>
      </div>
    </div>
  );
}

