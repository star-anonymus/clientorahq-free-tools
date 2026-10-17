"use client";
import { useEffect, useState } from "react";
import { Seg } from "@/components/ui/kit";

type Mode = "age" | "between" | "add" | "countdown";

const DAY = 86_400_000;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return y ? new Date(y, m - 1, d) : null; };
const fmtLong = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
/** Whole calendar days between two local dates, immune to DST shifts. */
const dayDiff = (a: Date, b: Date) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY);

function ymd(from: Date, to: Date) {
  let y = to.getFullYear() - from.getFullYear();
  let m = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  if (d < 0) { m--; d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d };
}

function addMonths(date: Date, n: number) {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  d.setDate(Math.min(date.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
}

function workingDays(a: Date, b: Date, includeEnd: boolean) {
  const [s, e] = a <= b ? [a, b] : [b, a];
  let n = 0;
  const d = new Date(s);
  const last = new Date(e);
  if (!includeEnd) last.setDate(last.getDate() - 1);
  while (d <= last) { const w = d.getDay(); if (w !== 0 && w !== 6) n++; d.setDate(d.getDate() + 1); }
  return n;
}

const plural = (n: number, w: string) => `${n.toLocaleString()} ${w}${n === 1 ? "" : "s"}`;

function Big({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cyan/40 bg-cyan/[0.06] p-5 text-center" aria-live="polite">
      <p className="text-[clamp(22px,4vw,32px)] font-extrabold text-cyan">{children}</p>
      {sub && <div className="mt-2 text-[15px] text-fg-2">{sub}</div>}
    </div>
  );
}

export default function DateCalculator() {
  const today = iso(new Date());
  const [mode, setMode] = useState<Mode>("age");
  const [dob, setDob] = useState("1995-06-15");
  const [asOf, setAsOf] = useState(today);
  const [a, setA] = useState(today);
  const [b, setB] = useState(iso(new Date(Date.now() + 30 * DAY)));
  const [incEnd, setIncEnd] = useState(false);
  const [base, setBase] = useState(today);
  const [amount, setAmount] = useState(90);
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years" | "workdays">("days");
  const [sign, setSign] = useState<1 | -1>(1);
  const [event, setEvent] = useState(`${new Date().getFullYear() + 1}-01-01T00:00`);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (mode !== "countdown") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mode]);

  return (
    <div className="space-y-5">
      <Seg label="Calculator" value={mode} onChange={setMode} options={[{ value: "age", label: "Age" }, { value: "between", label: "Days between" }, { value: "add", label: "Add / subtract" }, { value: "countdown", label: "Countdown" }]} />

      {mode === "age" && (() => {
        const d1 = parse(dob), d2 = parse(asOf);
        if (!d1 || !d2 || d1 > d2) return <><Inputs><DateIn label="Date of birth" v={dob} set={setDob} /><DateIn label="Age on" v={asOf} set={setAsOf} /></Inputs><p className="text-bad">Pick a birth date before the second date.</p></>;
        const { y, m, d } = ymd(d1, d2);
        const days = dayDiff(d1, d2);
        let next = new Date(d2.getFullYear(), d1.getMonth(), d1.getDate());
        if (next < d2) next = new Date(d2.getFullYear() + 1, d1.getMonth(), d1.getDate());
        const toNext = dayDiff(d2, next);
        return (
          <>
            <Inputs><DateIn label="Date of birth" v={dob} set={setDob} /><DateIn label="Age on" v={asOf} set={setAsOf} /></Inputs>
            <Big sub={<>Born on a {d1.toLocaleDateString("en-GB", { weekday: "long" })} · {toNext === 0 ? "Happy birthday — it is today!" : `next birthday in ${plural(toNext, "day")} (${next.toLocaleDateString("en-GB", { weekday: "long" })})`}</>}>
              {plural(y, "year")}, {plural(m, "month")}, {plural(d, "day")}
            </Big>
            <Stats items={[[days, "days"], [Math.floor(days / 7), "weeks"], [y * 12 + m, "months"], [days * 24, "hours"]]} />
          </>
        );
      })()}

      {mode === "between" && (() => {
        const d1 = parse(a), d2 = parse(b);
        if (!d1 || !d2) return null;
        const raw = Math.abs(dayDiff(d1, d2)) + (incEnd ? 1 : 0);
        const [s, e] = d1 <= d2 ? [d1, d2] : [d2, d1];
        const { y, m, d } = ymd(s, e);
        return (
          <>
            <Inputs><DateIn label="Start date" v={a} set={setA} /><DateIn label="End date" v={b} set={setB} /></Inputs>
            <label className="flex cursor-pointer items-center gap-2 text-[15px]"><input type="checkbox" className="check" checked={incEnd} onChange={(e) => setIncEnd(e.target.checked)} /> Include the end date</label>
            <Big sub={<>{y || m ? `${plural(y, "year")}, ${plural(m, "month")}, ${plural(d, "day")} · ` : ""}{plural(workingDays(d1, d2, incEnd), "working day")} (Mon–Fri)</>}>{plural(raw, "day")}</Big>
            <Stats items={[[Math.floor(raw / 7), `weeks + ${raw % 7} days`], [raw * 24, "hours"], [raw * 1440, "minutes"], [workingDays(d1, d2, incEnd), "working days"]]} />
          </>
        );
      })()}

      {mode === "add" && (() => {
        const d0 = parse(base);
        if (!d0) return null;
        let r: Date;
        const n = (amount || 0) * sign;
        if (unit === "days") r = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + n);
        else if (unit === "weeks") r = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + n * 7);
        else if (unit === "months") r = addMonths(d0, n);
        else if (unit === "years") r = addMonths(d0, n * 12);
        else {
          r = new Date(d0);
          let left = Math.abs(n);
          while (left > 0) { r.setDate(r.getDate() + sign); if (r.getDay() !== 0 && r.getDay() !== 6) left--; }
        }
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_120px_1fr] sm:items-end">
              <DateIn label="Start date" v={base} set={setBase} />
              <Seg label="Add or subtract" value={sign} onChange={setSign} options={[{ value: 1, label: "+ Add" }, { value: -1, label: "− Subtract" }]} />
              <div><label className="field-label" htmlFor="amt">Amount</label><input id="amt" type="number" min={0} value={amount} onChange={(e) => setAmount(+e.target.value)} className="input" /></div>
              <div><label className="field-label" htmlFor="unit">Unit</label>
                <select id="unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}>
                  <option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="years">Years</option><option value="workdays">Working days</option>
                </select>
              </div>
            </div>
            <Big sub={`${plural(Math.abs(dayDiff(d0, r)), "calendar day")} ${sign > 0 ? "after" : "before"} ${d0.toLocaleDateString("en-GB")}`}>{fmtLong(r)}</Big>
          </>
        );
      })()}

      {mode === "countdown" && (() => {
        const t = new Date(event).getTime();
        const ms = t - now;
        const past = ms < 0;
        const abs = Math.abs(ms);
        const parts: [number, string][] = [[Math.floor(abs / DAY), "days"], [Math.floor(abs / 3_600_000) % 24, "hours"], [Math.floor(abs / 60_000) % 60, "minutes"], [Math.floor(abs / 1000) % 60, "seconds"]];
        return (
          <>
            <div className="max-w-sm"><label className="field-label" htmlFor="ev">Event date and time</label><input id="ev" type="datetime-local" value={event} onChange={(e) => setEvent(e.target.value)} className="input" /></div>
            {isNaN(t) ? null : (
              <>
                <div className="grid grid-cols-4 gap-2" aria-live="off">
                  {parts.map(([n, l]) => <div key={l} className="stat text-center"><b className="!text-[clamp(26px,6vw,44px)] text-cyan">{String(n).padStart(2, "0")}</b><span>{l}</span></div>)}
                </div>
                <p className="text-center text-[15px] text-fg-2">{past ? "since" : "until"} {fmtLong(new Date(t))}, {new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </>
            )}
          </>
        );
      })()}
    </div>
  );
}

function Inputs({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
function DateIn({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return <div><label className="field-label" htmlFor={id}>{label}</label><input id={id} type="date" value={v} onChange={(e) => set(e.target.value)} className="input" /></div>;
}
function Stats({ items }: { items: [number, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([n, l]) => <div key={l} className="stat"><b className="!text-[20px]">{n.toLocaleString()}</b><span>{l}</span></div>)}
    </div>
  );
}
