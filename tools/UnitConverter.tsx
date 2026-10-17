"use client";
import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { CopyButton } from "@/components/ui/kit";

interface Unit { id: string; name: string; sym: string; f?: number; to?: (v: number) => number; from?: (v: number) => number }
interface Cat { id: string; name: string; units: Unit[]; def: [string, string] }

// Factors convert a unit to the category's base unit (m, kg, m², L, m/s, byte, s).
const CATS: Cat[] = [
  { id: "length", name: "Length", def: ["cm", "in"], units: [
    { id: "mm", name: "Millimetre", sym: "mm", f: 0.001 }, { id: "cm", name: "Centimetre", sym: "cm", f: 0.01 }, { id: "m", name: "Metre", sym: "m", f: 1 },
    { id: "km", name: "Kilometre", sym: "km", f: 1000 }, { id: "in", name: "Inch", sym: "in", f: 0.0254 }, { id: "ft", name: "Foot", sym: "ft", f: 0.3048 },
    { id: "yd", name: "Yard", sym: "yd", f: 0.9144 }, { id: "mi", name: "Mile", sym: "mi", f: 1609.344 }, { id: "nmi", name: "Nautical mile", sym: "nmi", f: 1852 },
    { id: "um", name: "Micrometre", sym: "µm", f: 1e-6 },
  ] },
  { id: "weight", name: "Weight", def: ["kg", "lb"], units: [
    { id: "mg", name: "Milligram", sym: "mg", f: 1e-6 }, { id: "g", name: "Gram", sym: "g", f: 0.001 }, { id: "kg", name: "Kilogram", sym: "kg", f: 1 },
    { id: "t", name: "Tonne", sym: "t", f: 1000 }, { id: "oz", name: "Ounce", sym: "oz", f: 0.028349523125 }, { id: "lb", name: "Pound", sym: "lb", f: 0.45359237 },
    { id: "st", name: "Stone", sym: "st", f: 6.35029318 }, { id: "tola", name: "Tola", sym: "tola", f: 0.0116638038 }, { id: "maund", name: "Maund", sym: "maund", f: 37.3242 },
  ] },
  { id: "temperature", name: "Temperature", def: ["c", "f"], units: [
    { id: "c", name: "Celsius", sym: "°C", to: (v) => v, from: (v) => v },
    { id: "f", name: "Fahrenheit", sym: "°F", to: (v) => (v - 32) * (5 / 9), from: (v) => v * (9 / 5) + 32 },
    { id: "k", name: "Kelvin", sym: "K", to: (v) => v - 273.15, from: (v) => v + 273.15 },
  ] },
  { id: "area", name: "Area", def: ["m2", "ft2"], units: [
    { id: "cm2", name: "Square centimetre", sym: "cm²", f: 1e-4 }, { id: "m2", name: "Square metre", sym: "m²", f: 1 }, { id: "km2", name: "Square kilometre", sym: "km²", f: 1e6 },
    { id: "in2", name: "Square inch", sym: "in²", f: 0.00064516 }, { id: "ft2", name: "Square foot", sym: "ft²", f: 0.09290304 }, { id: "yd2", name: "Square yard", sym: "yd²", f: 0.83612736 },
    { id: "ac", name: "Acre", sym: "ac", f: 4046.8564224 }, { id: "ha", name: "Hectare", sym: "ha", f: 10000 }, { id: "marla", name: "Marla (272.25 ft²)", sym: "marla", f: 25.29285264 },
    { id: "kanal", name: "Kanal (20 marla)", sym: "kanal", f: 505.8570528 }, { id: "mi2", name: "Square mile", sym: "mi²", f: 2589988.110336 },
  ] },
  { id: "volume", name: "Volume", def: ["l", "gal"], units: [
    { id: "ml", name: "Millilitre", sym: "mL", f: 0.001 }, { id: "l", name: "Litre", sym: "L", f: 1 }, { id: "m3", name: "Cubic metre", sym: "m³", f: 1000 },
    { id: "tsp", name: "Teaspoon (US)", sym: "tsp", f: 0.00492892159375 }, { id: "tbsp", name: "Tablespoon (US)", sym: "tbsp", f: 0.01478676478125 },
    { id: "cup", name: "Cup (US)", sym: "cup", f: 0.2365882365 }, { id: "floz", name: "Fluid ounce (US)", sym: "fl oz", f: 0.0295735295625 },
    { id: "pt", name: "Pint (US)", sym: "pt", f: 0.473176473 }, { id: "gal", name: "Gallon (US)", sym: "gal", f: 3.785411784 }, { id: "galuk", name: "Gallon (UK)", sym: "gal UK", f: 4.54609 },
  ] },
  { id: "speed", name: "Speed", def: ["kmh", "mph"], units: [
    { id: "ms", name: "Metres per second", sym: "m/s", f: 1 }, { id: "kmh", name: "Kilometres per hour", sym: "km/h", f: 1 / 3.6 },
    { id: "mph", name: "Miles per hour", sym: "mph", f: 0.44704 }, { id: "kn", name: "Knot", sym: "kn", f: 1852 / 3600 }, { id: "fts", name: "Feet per second", sym: "ft/s", f: 0.3048 },
  ] },
  { id: "data", name: "Data", def: ["mb", "gb"], units: [
    { id: "b", name: "Byte", sym: "B", f: 1 }, { id: "kb", name: "Kilobyte", sym: "KB", f: 1e3 }, { id: "mb", name: "Megabyte", sym: "MB", f: 1e6 },
    { id: "gb", name: "Gigabyte", sym: "GB", f: 1e9 }, { id: "tb", name: "Terabyte", sym: "TB", f: 1e12 }, { id: "kib", name: "Kibibyte", sym: "KiB", f: 1024 },
    { id: "mib", name: "Mebibyte", sym: "MiB", f: 1048576 }, { id: "gib", name: "Gibibyte", sym: "GiB", f: 1073741824 }, { id: "bit", name: "Bit", sym: "bit", f: 0.125 },
  ] },
  { id: "time", name: "Time", def: ["h", "min"], units: [
    { id: "ms", name: "Millisecond", sym: "ms", f: 0.001 }, { id: "s", name: "Second", sym: "s", f: 1 }, { id: "min", name: "Minute", sym: "min", f: 60 },
    { id: "h", name: "Hour", sym: "h", f: 3600 }, { id: "d", name: "Day", sym: "d", f: 86400 }, { id: "wk", name: "Week", sym: "wk", f: 604800 },
    { id: "mo", name: "Month (avg)", sym: "mo", f: 2629746 }, { id: "yr", name: "Year (365.25 d)", sym: "yr", f: 31557600 },
  ] },
];

function convert(v: number, from: Unit, to: Unit) {
  const base = from.to ? from.to(v) : v * from.f!;
  return to.from ? to.from(base) : base / to.f!;
}

function fmt(n: number) {
  if (!isFinite(n)) return "—";
  if (n === 0) return "0";
  const a = Math.abs(n);
  if (a >= 1e15 || a < 1e-6) return n.toExponential(6).replace(/\.?0+e/, "e");
  return Number(n.toPrecision(8)).toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export default function UnitConverter() {
  const [catId, setCatId] = useState("length");
  const cat = CATS.find((c) => c.id === catId)!;
  const [pair, setPair] = useState<Record<string, [string, string]>>({});
  const [fromId, toId] = pair[catId] ?? cat.def;
  const [value, setValue] = useState("1");

  const from = cat.units.find((u) => u.id === fromId)!;
  const to = cat.units.find((u) => u.id === toId)!;
  const v = parseFloat(value);
  const result = useMemo(() => (isNaN(v) ? NaN : convert(v, from, to)), [v, from, to]);

  const setUnits = (a: string, b: string) => setPair((p) => ({ ...p, [catId]: [a, b] }));

  return (
    <div className="space-y-5">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Category">
        {CATS.map((c) => (
          <button key={c.id} role="tab" type="button" aria-selected={c.id === catId} onClick={() => setCatId(c.id)}
            className={`min-h-10 flex-none cursor-pointer rounded-full border px-4 text-[14px] font-semibold transition-colors ${c.id === catId ? "border-cyan bg-cyan text-ink" : "border-line text-fg-2 hover:text-fg"}`}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-2">
          <label className="field-label" htmlFor="uv">From</label>
          <input id="uv" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="input !min-h-[58px] font-mono !text-[22px]" />
          <select aria-label="From unit" className="input" value={fromId} onChange={(e) => setUnits(e.target.value, toId)}>
            {cat.units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.sym})</option>)}
          </select>
        </div>
        <button type="button" className="btn btn-ghost btn-icon mx-auto md:mb-[54px]" aria-label="Swap units" onClick={() => setUnits(toId, fromId)}>
          <ArrowLeftRight size={18} />
        </button>
        <div className="space-y-2">
          <p className="field-label">To</p>
          <output aria-live="polite" className="flex min-h-[58px] items-center rounded-xl border border-cyan/50 bg-cyan/[0.06] px-4 font-mono text-[22px] font-bold text-cyan">{fmt(result)}</output>
          <select aria-label="To unit" className="input" value={toId} onChange={(e) => setUnits(fromId, e.target.value)}>
            {cat.units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.sym})</option>)}
          </select>
        </div>
      </div>

      {!isNaN(v) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-bg/40 px-4 py-3">
          <p className="text-[16px]"><b>{fmt(v)} {from.sym}</b> = <b className="text-cyan">{fmt(result)} {to.sym}</b></p>
          <CopyButton text={`${fmt(result)}`} label="Copy result" />
        </div>
      )}

      {!isNaN(v) && (
        <div>
          <p className="field-label">{fmt(v)} {from.sym} in every {cat.name.toLowerCase()} unit</p>
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-[14.5px]">
              <tbody>
                {cat.units.filter((u) => u.id !== from.id).map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0 even:bg-bg/40">
                    <td className="px-4 py-2.5 text-fg-2">{u.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-fg">{fmt(convert(v, from, u))} <span className="text-fg-3">{u.sym}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
