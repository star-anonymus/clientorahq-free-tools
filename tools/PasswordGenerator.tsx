"use client";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CopyButton, Seg } from "@/components/ui/kit";
import { pick, randInt, shuffle } from "@/lib/random";
import { WORDS } from "@/lib/wordlist";
import { crackTime, SCORE_COLORS } from "@/lib/strength";

type Mode = "password" | "passphrase" | "pin";

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
};
const LOOKALIKE = /[Il1O0o|`'"]/g;

interface Opts { length: number; upper: boolean; lower: boolean; digits: boolean; symbols: boolean; noSimilar: boolean }
interface PhraseOpts { words: number; sep: string; capitalize: boolean; number: boolean }

function makePassword(o: Opts) {
  const sets = (["upper", "lower", "digits", "symbols"] as const)
    .filter((k) => o[k])
    .map((k) => (o.noSimilar ? SETS[k].replace(LOOKALIKE, "") : SETS[k]));
  if (!sets.length) return "";
  const all = sets.join("");
  // One from each chosen set first, so every rule is always met; then fill and shuffle.
  const chars = sets.map((s) => s[randInt(s.length)]);
  while (chars.length < o.length) chars.push(all[randInt(all.length)]);
  return shuffle(chars).slice(0, o.length).join("");
}

function makePhrase(o: PhraseOpts) {
  const words = Array.from({ length: o.words }, () => {
    const w = pick(WORDS);
    return o.capitalize ? w[0].toUpperCase() + w.slice(1) : w;
  });
  if (o.number) words[randInt(words.length)] += String(randInt(10));
  return words.join(o.sep);
}

function makePin(len: number) {
  return Array.from({ length: len }, () => randInt(10)).join("");
}

export default function PasswordGenerator() {
  const [mode, setMode] = useState<Mode>("password");
  const [opts, setOpts] = useState<Opts>({ length: 16, upper: true, lower: true, digits: true, symbols: true, noSimilar: false });
  const [phrase, setPhrase] = useState<PhraseOpts>({ words: 6, sep: "-", capitalize: true, number: true });
  const [pinLen, setPinLen] = useState(6);
  const [value, setValue] = useState("");
  const [batch, setBatch] = useState<string[]>([]);

  const one = useCallback(() => (mode === "password" ? makePassword(opts) : mode === "passphrase" ? makePhrase(phrase) : makePin(pinLen)), [mode, opts, phrase, pinLen]);
  const regen = useCallback(() => { setValue(one()); setBatch([]); }, [one]);

  useEffect(() => { regen(); }, [regen]);

  // Entropy from how the value was built, not from guessing at its characters.
  const bits =
    mode === "password"
      ? opts.length * Math.log2(Math.max(1, (["upper", "lower", "digits", "symbols"] as const).filter((k) => opts[k]).reduce((n, k) => n + (opts.noSimilar ? SETS[k].replace(LOOKALIKE, "") : SETS[k]).length, 0)))
      : mode === "passphrase"
        ? phrase.words * Math.log2(WORDS.length) + (phrase.number ? Math.log2(10 * phrase.words) : 0)
        : pinLen * Math.log2(10);
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  const color = SCORE_COLORS[score];
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const noneChecked = mode === "password" && !(opts.upper || opts.lower || opts.digits || opts.symbols);

  const toggle = (k: keyof Opts) => setOpts((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="space-y-5">
      <Seg label="Type" value={mode} onChange={setMode} options={[{ value: "password", label: "Password" }, { value: "passphrase", label: "Passphrase" }, { value: "pin", label: "PIN" }]} />

      <div className="rounded-2xl border border-line-hi bg-bg/70 p-4 sm:p-5">
        <output aria-live="polite" className="block min-h-[48px] break-all font-mono text-[clamp(20px,3.4vw,28px)] font-semibold leading-snug text-fg">
          {noneChecked ? <span className="text-[16px] text-bad">Pick at least one character type.</span> : value}
        </output>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CopyButton text={value} className="btn btn-primary" />
          <button type="button" className="btn btn-ghost" onClick={regen}><RefreshCw size={16} /> New</button>
          {mode !== "pin" && (
            <span className="ml-auto flex items-center gap-2 text-[14px]">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-2 w-6 rounded-full" style={{ background: i <= score ? color : "rgb(41 230 255 / .12)" }} />)}
              </span>
              <b style={{ color }}>{labels[score]}</b>
            </span>
          )}
        </div>
        <p className="mt-3 text-[13px] text-fg-3">
          {Math.round(bits)} bits of entropy · time to crack at 10 billion guesses a second: <b className="text-fg-2">{crackTime(bits)}</b>
          {mode === "pin" && " — fine for a phone or card with a lockout, never for an online account"}
        </p>
      </div>

      {mode === "password" && (
        <div className="grid gap-5 rounded-2xl border border-line bg-bg/40 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label flex justify-between" htmlFor="len">Length <span className="font-mono text-cyan">{opts.length}</span></label>
            <input id="len" type="range" min={6} max={64} value={opts.length} onChange={(e) => setOpts((o) => ({ ...o, length: +e.target.value }))} className="range" />
          </div>
          {([["upper", "Uppercase (A–Z)"], ["lower", "Lowercase (a–z)"], ["digits", "Numbers (0–9)"], ["symbols", "Symbols (!@#$)"], ["noSimilar", "Avoid look-alikes (l, 1, O, 0)"]] as const).map(([k, l]) => (
            <label key={k} className="flex cursor-pointer items-center gap-2.5 text-[15px]">
              <input type="checkbox" className="check" checked={opts[k] as boolean} onChange={() => toggle(k)} /> {l}
            </label>
          ))}
        </div>
      )}

      {mode === "passphrase" && (
        <div className="grid gap-5 rounded-2xl border border-line bg-bg/40 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label flex justify-between" htmlFor="wn">Words <span className="font-mono text-cyan">{phrase.words}</span></label>
            <input id="wn" type="range" min={3} max={10} value={phrase.words} onChange={(e) => setPhrase((p) => ({ ...p, words: +e.target.value }))} className="range" />
          </div>
          <div>
            <p className="field-label">Separator</p>
            <Seg label="Separator" value={phrase.sep} onChange={(sep) => setPhrase((p) => ({ ...p, sep }))} options={[{ value: "-", label: "-" }, { value: ".", label: "." }, { value: "_", label: "_" }, { value: " ", label: "space" }]} />
          </div>
          <div className="space-y-2.5 pt-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-[15px]"><input type="checkbox" className="check" checked={phrase.capitalize} onChange={() => setPhrase((p) => ({ ...p, capitalize: !p.capitalize }))} /> Capitalise words</label>
            <label className="flex cursor-pointer items-center gap-2.5 text-[15px]"><input type="checkbox" className="check" checked={phrase.number} onChange={() => setPhrase((p) => ({ ...p, number: !p.number }))} /> Add a number</label>
          </div>
        </div>
      )}

      {mode === "pin" && (
        <div className="rounded-2xl border border-line bg-bg/40 p-4">
          <p className="field-label">PIN length</p>
          <Seg label="PIN length" value={pinLen} onChange={setPinLen} options={[4, 5, 6, 8, 10, 12].map((n) => ({ value: n, label: String(n) }))} />
        </div>
      )}

      <div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBatch(Array.from({ length: 10 }, one))}>Generate 10 at once</button>
        {batch.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-bg/40">
            {batch.map((b, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2">
                <code className="min-w-0 flex-1 break-all font-mono text-[14.5px]">{b}</code>
                <CopyButton text={b} label="Copy" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
