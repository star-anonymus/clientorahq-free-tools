"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Pause, Play, Plus, RotateCcw, SkipForward, Trash2, Check, Settings2, Timer } from "lucide-react";
import { IconBtn, Seg } from "@/components/ui/kit";
import { bell, useLocal } from "@/lib/store";

type Phase = "focus" | "short" | "long";
interface Task { id: string; text: string; done: boolean; pomos: number }
interface Log { at: number; mins: number; task?: string }

const LABEL: Record<Phase, string> = { focus: "Focus", short: "Short break", long: "Long break" };
const COLOR: Record<Phase, string> = { focus: "#29e6ff", short: "#5ee59a", long: "#b9a0ff" };

export default function PomodoroTimer() {
  const [cfg, setCfg] = useLocal("cq-pomo-cfg", { focus: 25, short: 5, long: 15, every: 4, auto: false });
  const [tasks, setTasks] = useLocal<Task[]>("cq-pomo-tasks", []);
  const [log, setLog] = useLocal<Log[]>("cq-pomo-log", []);
  const [phase, setPhase] = useState<Phase>("focus");
  const [left, setLeft] = useState(cfg.focus * 60_000);
  const [endAt, setEndAt] = useState<number | null>(null); // running when set
  const [count, setCount] = useState(0); // focus sessions finished this cycle
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showCfg, setShowCfg] = useState(false);
  const [notify, setNotify] = useState(false);
  const finishing = useRef(false);

  const total = cfg[phase] * 60_000;

  useEffect(() => { if (!endAt) setLeft(cfg[phase] * 60_000); }, [cfg, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setNotify(typeof Notification !== "undefined" && Notification.permission === "granted"); }, []);

  const finish = useCallback((skipped = false) => {
    if (finishing.current) return;
    finishing.current = true;
    if (!skipped) bell(phase === "focus" ? 3 : 2);
    let next: Phase = "focus";
    if (phase === "focus" && skipped) next = "short";
    else if (phase === "focus") {
      const task = tasks.find((t) => t.id === active);
      setLog((l) => [...l.filter((x) => x.at > Date.now() - 30 * 86_400_000), { at: Date.now(), mins: cfg.focus, task: task?.text }]);
      if (task) setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, pomos: t.pomos + 1 } : t)));
      const n = count + 1;
      setCount(n);
      next = n % cfg.every === 0 ? "long" : "short";
    }
    if (notify && !skipped) try { new Notification(phase === "focus" ? "Focus session done — take a break" : "Break over — back to focus", { icon: "/icon.png" }); } catch { /* ignore */ }
    setPhase(next);
    const ms = cfg[next] * 60_000;
    setLeft(ms);
    setEndAt(cfg.auto ? Date.now() + ms : null);
    setTimeout(() => (finishing.current = false), 500);
  }, [phase, tasks, active, cfg, count, notify, setLog, setTasks]);

  useEffect(() => {
    if (!endAt) return;
    const tick = () => {
      const ms = endAt - Date.now();
      if (ms <= 0) finish();
      else setLeft(ms);
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [endAt, finish]);

  const mmss = `${String(Math.floor(Math.ceil(left / 1000) / 60)).padStart(2, "0")}:${String(Math.ceil(left / 1000) % 60).padStart(2, "0")}`;

  const baseTitle = useRef("");
  useEffect(() => {
    if (!baseTitle.current) baseTitle.current = document.title;
    const base = baseTitle.current;
    document.title = endAt ? `${mmss} · ${LABEL[phase]}` : base;
    return () => { document.title = base; };
  }, [mmss, endAt, phase]);

  const start = () => setEndAt(Date.now() + left);
  const pause = () => { if (endAt) setLeft(endAt - Date.now()); setEndAt(null); };
  const reset = () => { setEndAt(null); setLeft(total); };
  const switchTo = (p: Phase) => { setEndAt(null); setPhase(p); setLeft(cfg[p] * 60_000); };

  const today = log.filter((l) => new Date(l.at).toDateString() === new Date().toDateString());
  const r = 120;
  const C = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, left / total));

  return (
    <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col items-center gap-5">
        <Seg label="Session" value={phase} onChange={switchTo} options={(["focus", "short", "long"] as Phase[]).map((p) => ({ value: p, label: LABEL[p] }))} />
        <div className="relative grid aspect-square w-full max-w-[300px] place-items-center">
          <svg viewBox="0 0 260 260" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="130" cy="130" r={r} fill="none" stroke="rgb(41 230 255 / .1)" strokeWidth="10" />
            <circle cx="130" cy="130" r={r} fill="none" stroke={COLOR[phase]} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: "stroke-dashoffset .25s linear", filter: `drop-shadow(0 0 8px ${COLOR[phase]}88)` }} />
          </svg>
          <div className="text-center">
            <p className="font-mono text-[clamp(52px,12vw,72px)] font-bold leading-none tabular-nums" role="timer" aria-live="off">{mmss}</p>
            <p className="mt-2 text-[14px] font-semibold uppercase tracking-[0.18em]" style={{ color: COLOR[phase] }}>{LABEL[phase]}</p>
            {active && <p className="mx-auto mt-2 max-w-[200px] truncate text-[13px] text-fg-3">{tasks.find((t) => t.id === active)?.text}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <IconBtn label="Reset timer" onClick={reset}><RotateCcw size={20} /></IconBtn>
          {endAt
            ? <button type="button" className="btn btn-primary btn-lg min-w-40" onClick={pause}><Pause size={20} /> Pause</button>
            : <button type="button" className="btn btn-primary btn-lg min-w-40" onClick={start}><Play size={20} /> Start</button>}
          <IconBtn label="Skip to next session" onClick={() => finish(true)}><SkipForward size={20} /></IconBtn>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {!notify && typeof Notification !== "undefined" && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={async () => setNotify((await Notification.requestPermission()) === "granted")}><Bell size={15} /> Desktop alerts</button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => bell(1)}>Test sound</button>
          <button type="button" className="btn btn-ghost btn-sm" aria-expanded={showCfg} onClick={() => setShowCfg((v) => !v)}><Settings2 size={15} /> Settings</button>
        </div>
        {showCfg && (
          <div className="grid w-full max-w-md grid-cols-2 gap-3 rounded-2xl border border-line bg-bg/40 p-4 sm:grid-cols-4">
            {([["focus", "Focus"], ["short", "Short"], ["long", "Long"], ["every", "Long every"]] as const).map(([k, l]) => (
              <div key={k}>
                <label className="field-label" htmlFor={`c-${k}`}>{l}{k === "every" ? "" : " (min)"}</label>
                <input id={`c-${k}`} type="number" min={1} max={k === "every" ? 12 : 180} value={cfg[k]} onChange={(e) => setCfg((c) => ({ ...c, [k]: Math.max(1, +e.target.value || 1) }))} className="input" />
              </div>
            ))}
            <label className="col-span-full flex cursor-pointer items-center gap-2 text-[14.5px]"><input type="checkbox" className="check" checked={cfg.auto} onChange={(e) => setCfg((c) => ({ ...c, auto: e.target.checked }))} /> Start the next session automatically</label>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-bg/40 p-4">
          <p className="field-label">Tasks</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; const id = crypto.randomUUID(); setTasks((t) => [...t, { id, text: draft.trim(), done: false, pomos: 0 }]); setActive((a) => a ?? id); setDraft(""); }}>
            <label htmlFor="task" className="sr-only">New task</label>
            <input id="task" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What are you working on?" className="input" />
            <button type="submit" className="btn btn-ghost btn-icon flex-none" aria-label="Add task"><Plus size={18} /></button>
          </form>
          <ul className="mt-3 space-y-1">
            {tasks.map((t) => (
              <li key={t.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${active === t.id ? "bg-cyan/10" : ""}`}>
                <button type="button" aria-label={t.done ? `Mark ${t.text} not done` : `Mark ${t.text} done`} onClick={() => setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                  className={`grid h-6 w-6 flex-none cursor-pointer place-items-center rounded-md border ${t.done ? "border-ok bg-ok text-ink" : "border-line-hi"}`}>
                  {t.done && <Check size={14} />}
                </button>
                <button type="button" onClick={() => setActive(t.id)} className={`min-w-0 flex-1 cursor-pointer truncate text-left text-[14.5px] ${t.done ? "text-fg-3 line-through" : "text-fg"}`} aria-pressed={active === t.id}>
                  {t.text}
                </button>
                <span className="flex items-center gap-1 font-mono text-[12.5px] text-fg-3" title="Focus sessions done"><Timer size={13} aria-hidden="true" />{t.pomos}</span>
                <IconBtn label={`Delete ${t.text}`} onClick={() => { setTasks((ts) => ts.filter((x) => x.id !== t.id)); if (active === t.id) setActive(null); }}><Trash2 size={15} /></IconBtn>
              </li>
            ))}
          </ul>
          {!tasks.length && <p className="mt-2 text-[13.5px] text-fg-3">Add a task, then tap it to focus on it.</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="stat"><b>{today.length}</b><span>{today.length === 1 ? "session" : "sessions"} today</span></div>
          <div className="stat"><b>{(today.reduce((n, l) => n + l.mins, 0) / 60).toFixed(1)} h</b><span>focused today</span></div>
        </div>
        {log.length > 0 && <button type="button" className="text-[13px] text-fg-3 underline-offset-2 hover:text-cyan hover:underline" onClick={() => setLog([])}>Clear history</button>}
      </aside>
    </div>
  );
}
