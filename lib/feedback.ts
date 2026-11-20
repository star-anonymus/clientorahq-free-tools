// The feedback step after each use of a tool (the owner's rule: everyone who uses a tool is asked, every time).
// - A use ends with a result: downloadBlob and copyText call markUsed() for you; tools whose result is only
//   shown on screen call markUsed() themselves.
// - The result is never held back. A card under the tool asks for 1-5 stars and an optional comment.
// - Until it is answered or skipped, the next use (a new file, Start over, another result, typing new input,
//   or opening any tool page) first shows the same question in a popup. gate(next) runs `next` after it.
// - Sent to the platform's contact API (topic "tool"): the tool, this site, the page path, the rating and the
//   comment. No name, email or file data. Skips are recorded too, so the answer rate can be seen.
// Nothing here touches the visitor's files: they still never leave the device.

export const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL || "https://platform.clientorahq.com/api/contact";
const KEY = "cq_tool_feedback";
const DAY = 24 * 3600 * 1000;
/** Results within this time of the first one count as the same use (a second download or copy of it). */
export const SAME_USE_MS = 30_000;

export interface Pending { tool: string; name: string; page: string; at: number }

let memory: Pending | null = null; // when storage is blocked (private mode), the question still holds in this tab

export function getPending(now = Date.now()): Pending | null {
  let p: Pending | null = memory;
  try {
    const raw = localStorage.getItem(KEY);
    p = raw ? (JSON.parse(raw) as Pending) : memory;
  } catch { /* storage blocked */ }
  if (!p || typeof p.tool !== "string" || typeof p.at !== "number" || now - p.at > DAY) return null;
  return p;
}

export function setPending(p: Pending | null) {
  memory = p;
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch { /* storage blocked */ }
}

/** Called when a tool hands the visitor a result (a download, a copy, a shown answer). */
export function markUsed() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cq-result"));
}

let gateHandler: ((next?: () => void) => boolean) | null = null;
export function setGateHandler(h: typeof gateHandler) { gateHandler = h; }

/** Before starting a new use: runs `next` now when nothing is pending, or after the visitor answers or skips. */
export function gate(next: () => void) {
  if (!gateHandler || gateHandler(next)) next();
}

export type Rating = "1" | "2" | "3" | "4" | "5" | "skip";

export function feedbackBody(p: Pick<Pending, "tool" | "page">, rating: Rating, comment: string) {
  return { topic: "tool", tool: p.tool, site: "tools", page: p.page, rating, comment: rating === "skip" ? "" : comment.trim().slice(0, 1000), website: "", cq_hp: "" };
}

/** Sends one answer. Resolves when it is saved, throws with a message to show otherwise. */
export async function sendFeedback(p: Pick<Pending, "tool" | "page">, rating: Rating, comment: string, fetcher: typeof fetch = fetch) {
  let r: Response;
  try {
    r = await fetcher(FEEDBACK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(feedbackBody(p, rating, comment)), keepalive: true });
  } catch {
    throw new Error("Your feedback wasn't sent: check your internet and press Retry.");
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || "Your feedback wasn't sent. Please press Retry.");
  }
}
