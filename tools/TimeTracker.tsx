"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Play, Plus, Square, Trash2, FolderPlus } from "lucide-react";
import { IconBtn } from "@/components/ui/kit";
import { downloadText } from "@/lib/files";
import { useLocal } from "@/lib/store";

interface Project { id: string; name: string; color: string; rate: number }
interface Entry { id: string; desc: string; project: string; start: number; end: number }
interface Running { desc: string; project: string; start: number }

const COLORS = ["#29e6ff", "#5ee59a", "#ffc857", "#ff7a8a", "#b9a0ff", "#7db8ff", "#ff9f6b"];
const DAY = 86_400_000;
const uid = () => Math.random().toString(36).slice(2, 10);

const hms = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const hours = (ms: number) => (ms / 3_600_000).toFixed(2);
const weekStart = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
const timeStr = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const toLocalInput = (t: number) => { const d = new Date(t); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export default function TimeTracker() {
  const [projects, setProjects] = useLocal<Project[]>("cq-tt-projects", [{ id: "p1", name: "Client work", color: COLORS[0], rate: 25 }]);
  const [entries, setEntries] = useLocal<Entry[]>("cq-tt-entries", []);
  const [running, setRunning] = useLocal<Running | null>("cq-tt-running", null);
  const [desc, setDesc] = useState("");
  const [proj, setProj] = useState("p1");
  const [now, setNow] = useState(() => Date.now());
  const [week, setWeek] = useState(() => weekStart(Date.now()));
  const [newProj, setNewProj] = useState({ name: "", rate: "" });
  const [manual, setManual] = useState(false);
  const [m, setM] = useState({ desc: "", project: "p1", start: toLocalInput(Date.now() - 3_600_000), end: toLocalInput(Date.now()) });

  useEffect(() => { if (!running) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [running]);
  useEffect(() => { if (running) { setDesc(running.desc); setProj(running.project); } }, [running]);

  const pById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const inWeek = entries.filter((e) => e.start >= week && e.start < week + 7 * DAY).sort((a, b) => b.start - a.start);
  const weekTotal = inWeek.reduce((n, e) => n + e.end - e.start, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d0 = week + i * DAY;
    return { d0, ms: inWeek.filter((e) => e.start >= d0 && e.start < d0 + DAY).reduce((n, e) => n + e.end - e.start, 0) };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.ms));
  const perProject = projects.map((p) => ({ p, ms: inWeek.filter((e) => e.project === p.id).reduce((n, e) => n + e.end - e.start, 0) })).filter((x) => x.ms > 0);
  const earnings = perProject.reduce((n, x) => n + (x.ms / 3_600_000) * x.p.rate, 0);

  const start = () => setRunning({ desc: desc.trim() || "Untitled task", project: proj, start: Date.now() });
  const stop = () => {
    if (!running) return;
    const end = Date.now();
    if (end - running.start > 1000) setEntries((es) => [...es, { id: uid(), desc: running.desc, project: running.project, start: running.start, end }]);
    setRunning(null);
    setDesc("");
  };

  const exportCsv = (all: boolean) => {
    const rows = (all ? entries : inWeek).slice().sort((a, b) => a.start - b.start);
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = ["Date,Start,End,Hours,Project,Rate,Amount,Description", ...rows.map((e) => {
      const p = pById[e.project];
      const h = (e.end - e.start) / 3_600_000;
      return [new Date(e.start).toLocaleDateString("en-CA"), timeStr(e.start), timeStr(e.end), h.toFixed(2), esc(p?.name ?? ""), p?.rate ?? 0, (h * (p?.rate ?? 0)).toFixed(2), esc(e.desc)].join(",");
    })];
    downloadText(lines.join("\n"), all ? "timesheet-all.csv" : `timesheet-week-${new Date(week).toLocaleDateString("en-CA")}.csv`, "text/csv");
  };

  return (
    <div className="space-y-6">
      {/* Timer bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line-hi bg-bg/60 p-3 sm:flex-row sm:items-center">
        <label htmlFor="tt-desc" className="sr-only">What are you working on?</label>
        <input id="tt-desc" className="input flex-1" placeholder="What are you working on?" value={desc} disabled={!!running}
          onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !running) start(); }} />
        <label htmlFor="tt-proj" className="sr-only">Project</label>
        <select id="tt-proj" className="input sm:w-48" value={proj} disabled={!!running} onChange={(e) => setProj(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-center font-mono text-[24px] font-bold tabular-nums sm:w-32" role="timer">{hms(running ? now - running.start : 0)}</span>
        {running
          ? <button type="button" className="btn btn-lg bg-bad text-white hover:bg-bad/90" onClick={stop}><Square size={17} fill="currentColor" /> Stop</button>
          : <button type="button" className="btn btn-primary btn-lg" onClick={start}><Play size={18} /> Start</button>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <IconBtn label="Previous week" onClick={() => setWeek(week - 7 * DAY)}><ChevronLeft size={18} /></IconBtn>
        <p className="min-w-44 text-center text-[15px] font-semibold">
          {week === weekStart(Date.now()) ? "This week" : `${new Date(week).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(week + 6 * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
        </p>
        <IconBtn label="Next week" disabled={week >= weekStart(Date.now())} onClick={() => setWeek(week + 7 * DAY)}><ChevronRight size={18} /></IconBtn>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManual((v) => !v)} aria-expanded={manual}><Plus size={15} /> Add time</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!inWeek.length} onClick={() => exportCsv(false)}><Download size={15} /> Week CSV</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!entries.length} onClick={() => exportCsv(true)}><Download size={15} /> All CSV</button>
        </div>
      </div>

      {manual && (
        <form className="grid gap-3 rounded-2xl border border-line bg-bg/40 p-4 sm:grid-cols-[1fr_160px_190px_190px_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const s = new Date(m.start).getTime(), en = new Date(m.end).getTime();
            if (!(en > s)) return;
            setEntries((es) => [...es, { id: uid(), desc: m.desc.trim() || "Untitled task", project: m.project, start: s, end: en }]);
            setManual(false);
          }}>
          <div><label className="field-label" htmlFor="m-d">Description</label><input id="m-d" className="input" value={m.desc} onChange={(e) => setM({ ...m, desc: e.target.value })} /></div>
          <div><label className="field-label" htmlFor="m-p">Project</label><select id="m-p" className="input" value={m.project} onChange={(e) => setM({ ...m, project: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="field-label" htmlFor="m-s">Start</label><input id="m-s" type="datetime-local" className="input" value={m.start} onChange={(e) => setM({ ...m, start: e.target.value })} /></div>
          <div><label className="field-label" htmlFor="m-e">End</label><input id="m-e" type="datetime-local" className="input" value={m.end} onChange={(e) => setM({ ...m, end: e.target.value })} /></div>
          <button type="submit" className="btn btn-primary" disabled={!(new Date(m.end) > new Date(m.start))}>Add</button>
        </form>
      )}

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {/* Week bars */}
          <div className="grid grid-cols-7 items-end gap-2 rounded-2xl border border-line bg-bg/40 p-4" style={{ height: 170 }}>
            {days.map((d) => (
              <div key={d.d0} className="flex h-full flex-col items-center justify-end gap-1">
                <span className="font-mono text-[11px] text-fg-3">{d.ms ? hours(d.ms) : ""}</span>
                <div className="w-full max-w-10 rounded-t-md bg-cyan/80" style={{ height: `${(d.ms / maxDay) * 100}%`, minHeight: d.ms ? 3 : 0 }} title={`${hours(d.ms)} h`} />
                <span className={`text-[12px] ${new Date(d.d0).toDateString() === new Date().toDateString() ? "font-bold text-cyan" : "text-fg-2"}`}>{new Date(d.d0).toLocaleDateString("en-GB", { weekday: "short" })}</span>
              </div>
            ))}
          </div>

          {inWeek.length ? (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-bg/40">
              {inWeek.map((e) => {
                const p = pById[e.project];
                return (
                  <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: p?.color ?? "#888" }} aria-hidden="true" />
                    <input aria-label="Description" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none focus:text-cyan" value={e.desc} onChange={(ev) => setEntries((es) => es.map((x) => (x.id === e.id ? { ...x, desc: ev.target.value } : x)))} />
                    <span className="text-[13px] text-fg-3">{p?.name}</span>
                    <span className="text-[13px] text-fg-3">{new Date(e.start).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })} · {timeStr(e.start)}–{timeStr(e.end)}</span>
                    <span className="w-20 text-right font-mono text-[14px] font-semibold">{hms(e.end - e.start)}</span>
                    <IconBtn label={`Delete ${e.desc}`} onClick={() => setEntries((es) => es.filter((x) => x.id !== e.id))}><Trash2 size={15} /></IconBtn>
                  </li>
                );
              })}
            </ul>
          ) : <p className="rounded-2xl border border-dashed border-line p-8 text-center text-fg-3">No time tracked this week yet. Type a task and press Start.</p>}
        </div>

        <aside className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="stat"><b>{hours(weekTotal)} h</b><span>this week</span></div>
            <div className="stat"><b>{earnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b><span>earned (at your rates)</span></div>
          </div>
          <div className="rounded-2xl border border-line bg-bg/40 p-4">
            <p className="field-label">Projects &amp; hourly rates</p>
            <ul className="space-y-2">
              {projects.map((p) => {
                const ms = perProject.find((x) => x.p.id === p.id)?.ms ?? 0;
                return (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="h-3 w-3 flex-none rounded-full" style={{ background: p.color }} aria-hidden="true" />
                    <input aria-label="Project name" className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none focus:text-cyan" value={p.name} onChange={(e) => setProjects((ps) => ps.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))} />
                    <input aria-label={`${p.name} hourly rate`} type="number" min={0} className="w-16 rounded-md border border-line bg-bg px-1.5 py-1 text-right text-[13.5px]" value={p.rate} onChange={(e) => setProjects((ps) => ps.map((x) => (x.id === p.id ? { ...x, rate: +e.target.value } : x)))} />
                    <span className="w-14 text-right font-mono text-[12.5px] text-fg-3">{hours(ms)}h</span>
                    {projects.length > 1 && <IconBtn label={`Delete project ${p.name}`} onClick={() => { if (confirm(`Delete "${p.name}"? Its time entries stay but lose their project.`)) setProjects((ps) => ps.filter((x) => x.id !== p.id)); }}><Trash2 size={14} /></IconBtn>}
                  </li>
                );
              })}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              if (!newProj.name.trim()) return;
              setProjects((ps) => [...ps, { id: uid(), name: newProj.name.trim(), color: COLORS[ps.length % COLORS.length], rate: +newProj.rate || 0 }]);
              setNewProj({ name: "", rate: "" });
            }}>
              <input aria-label="New project name" className="input !min-h-10" placeholder="New project" value={newProj.name} onChange={(e) => setNewProj({ ...newProj, name: e.target.value })} />
              <input aria-label="Hourly rate" type="number" min={0} className="input !min-h-10 !w-20" placeholder="Rate" value={newProj.rate} onChange={(e) => setNewProj({ ...newProj, rate: e.target.value })} />
              <button type="submit" className="btn btn-ghost btn-icon flex-none" aria-label="Add project"><FolderPlus size={17} /></button>
            </form>
          </div>
          <p className="text-[12.5px] text-fg-3">Everything is saved in this browser only. Export a CSV now and then as a backup — or to attach to an invoice.</p>
        </aside>
      </div>
    </div>
  );
}
