"use client";
import { useState } from "react";
import { Seg } from "@/components/ui/kit";

type Units = "metric" | "imperial";
type Sex = "male" | "female";

const ACTIVITY = [
  { f: 1.2, label: "Sitting most of the day" },
  { f: 1.375, label: "Light exercise 1–3 days/week" },
  { f: 1.55, label: "Moderate exercise 3–5 days/week" },
  { f: 1.725, label: "Hard exercise 6–7 days/week" },
  { f: 1.9, label: "Very hard exercise or physical job" },
];

const BANDS = [
  { max: 18.5, label: "Underweight", color: "#7db8ff" },
  { max: 25, label: "Healthy weight", color: "#5ee59a" },
  { max: 30, label: "Overweight", color: "#ffc857" },
  { max: 35, label: "Obese (class 1)", color: "#ff9f6b" },
  { max: Infinity, label: "Obese (class 2+)", color: "#ff7a8a" },
];

export default function BmiCalculator() {
  const [units, setUnits] = useState<Units>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [cm, setCm] = useState(175);
  const [kg, setKg] = useState(75);
  const [ft, setFt] = useState(5);
  const [inch, setInch] = useState(9);
  const [lb, setLb] = useState(165);
  const [act, setAct] = useState(1.375);

  const h = units === "metric" ? cm / 100 : (ft * 12 + inch) * 0.0254;
  const w = units === "metric" ? kg : lb * 0.45359237;
  const valid = h > 0.5 && h < 2.6 && w > 10 && w < 400 && age > 1;
  const bmi = valid ? w / (h * h) : 0;
  const band = BANDS.find((b) => bmi < b.max)!;
  const bmr = 10 * w + 625 * h - 5 * age + (sex === "male" ? 5 : -161); // Mifflin-St Jeor (6.25 × cm)
  const tdee = bmr * act;
  const lo = 18.5 * h * h;
  const hi = 24.9 * h * h;
  const water = w * 0.033; // ~33 ml per kg
  const showW = (x: number) => (units === "metric" ? `${x.toFixed(1)} kg` : `${(x / 0.45359237).toFixed(0)} lb`);
  // Marker on a 15–40 scale.
  const pos = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));

  return (
    <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Seg label="Units" value={units} onChange={setUnits} options={[{ value: "metric", label: "Metric" }, { value: "imperial", label: "Imperial" }]} />
          <Seg label="Sex" value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Num id="age" label="Age" v={age} set={setAge} suffix="yrs" />
          {units === "metric" ? (
            <>
              <Num id="cm" label="Height" v={cm} set={setCm} suffix="cm" />
              <Num id="kg" label="Weight" v={kg} set={setKg} suffix="kg" />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Num id="ft" label="Height (feet)" v={ft} set={setFt} suffix="ft" />
                <Num id="in" label="Inches" v={inch} set={setInch} suffix="in" />
              </div>
              <Num id="lb" label="Weight" v={lb} set={setLb} suffix="lb" />
            </>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="act">Activity</label>
          <select id="act" className="input" value={act} onChange={(e) => setAct(+e.target.value)}>
            {ACTIVITY.map((a) => <option key={a.f} value={a.f}>{a.label}</option>)}
          </select>
        </div>
      </div>

      {valid ? (
        <div className="space-y-4" aria-live="polite">
          <div className="rounded-2xl border border-line-hi bg-bg/60 p-5">
            <p className="text-[14px] text-fg-3">Your BMI</p>
            <p className="text-[46px] font-extrabold leading-none" style={{ color: band.color }}>{bmi.toFixed(1)}</p>
            <p className="mt-1 font-semibold" style={{ color: band.color }}>{band.label}</p>
            <div className="relative mt-5 h-3 rounded-full" style={{ background: "linear-gradient(90deg,#7db8ff 0 14%,#5ee59a 14% 40%,#ffc857 40% 60%,#ff9f6b 60% 80%,#ff7a8a 80%)" }}>
              <span className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-bg bg-fg shadow" style={{ left: `${pos}%` }} aria-hidden="true" />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[11.5px] text-fg-3"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="stat"><b>{Math.round(tdee).toLocaleString()}</b><span>kcal/day to keep weight</span></div>
            <div className="stat"><b>{Math.round(bmr).toLocaleString()}</b><span>kcal/day at rest (BMR)</span></div>
            <div className="stat"><b>{Math.round(tdee - 500).toLocaleString()}</b><span>kcal/day to lose ~0.5 kg/week</span></div>
            <div className="stat"><b>{Math.round(tdee + 300).toLocaleString()}</b><span>kcal/day to gain slowly</span></div>
            <div className="stat"><b className="!text-[20px]">{showW(lo)} – {showW(hi)}</b><span>healthy weight for your height</span></div>
            <div className="stat"><b>{water.toFixed(1)} L</b><span>water a day (≈ {Math.round(water / 0.25)} glasses)</span></div>
          </div>
          <p className="text-[12.5px] text-fg-3">For adults 18+. A guide, not medical advice — speak to a doctor about your health.</p>
        </div>
      ) : (
        <p className="text-fg-3">Enter your height, weight and age to see results.</p>
      )}
    </div>
  );
}

function Num({ id, label, v, set, suffix }: { id: string; label: string; v: number; set: (n: number) => void; suffix: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input id={id} type="number" inputMode="decimal" value={Number.isNaN(v) ? "" : v} onChange={(e) => set(parseFloat(e.target.value))} className="input !pr-12" />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-fg-3">{suffix}</span>
      </div>
    </div>
  );
}
