"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lightbulb, ShieldCheck } from "lucide-react";
import { checkStrength, SCORE_COLORS } from "@/lib/strength";

export default function PasswordStrength() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const s = checkStrength(pw);
  const color = SCORE_COLORS[s.score];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="relative">
        <label htmlFor="pw" className="sr-only">Password to check</label>
        <input
          id="pw"
          type={show ? "text" : "password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Type a password to test"
          autoComplete="off"
          spellCheck={false}
          className="input !min-h-[58px] !pr-14 font-mono !text-[18px]"
          autoFocus
        />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-fg-3 hover:text-cyan">
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div aria-live="polite">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-2.5 flex-1 rounded-full transition-colors" style={{ background: pw && i <= s.score ? color : "rgb(41 230 255 / .12)" }} />)}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="stat"><b style={{ color: pw ? color : undefined }} className="!text-[20px]">{s.label}</b><span>strength</span></div>
          <div className="stat"><b className="!text-[20px]">{s.bits}</b><span>bits of entropy</span></div>
          <div className="stat"><b className="!text-[16px] leading-tight">{s.crack}</b><span>to crack offline</span></div>
        </div>
      </div>

      {pw && s.tips.length > 0 && (
        <ul className="space-y-2 rounded-2xl border border-line bg-bg/40 p-4">
          {s.tips.map((t) => (
            <li key={t} className="flex gap-2.5 text-[15px] text-fg-2"><Lightbulb size={18} className="mt-0.5 flex-none text-warn" aria-hidden="true" /> {t}</li>
          ))}
        </ul>
      )}
      {pw && s.score >= 4 && (
        <p className="flex items-center gap-2 rounded-2xl border border-ok/30 bg-ok/10 p-4 text-[15px] text-ok"><ShieldCheck size={18} /> Excellent. Store it in a password manager and use it on one site only.</p>
      )}
      <p className="text-center text-[14px] text-fg-3">
        Need a better one? <Link href="/password-generator" className="font-semibold text-cyan hover:underline">Generate a strong password</Link>
      </p>
    </div>
  );
}
