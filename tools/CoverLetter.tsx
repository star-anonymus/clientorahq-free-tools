"use client";
import { useEffect, useId, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { CopyButton, Seg, Spinner } from "@/components/ui/kit";
import { downloadBlob, downloadText } from "@/lib/files";
import { useLocal } from "@/lib/store";
import { toast } from "@/lib/toast";

type Tone = "formal" | "friendly" | "confident";
type Kind = "job" | "freelance" | "internship";

interface Form {
  kind: Kind; tone: Tone; name: string; contact: string; manager: string; company: string; role: string;
  years: string; field: string; s1: string; s2: string; s3: string; why: string;
}

const START: Form = {
  kind: "job", tone: "friendly", name: "Your Name", contact: "you@email.com · +92 300 0000000", manager: "", company: "Acme Ltd",
  role: "Frontend Developer", years: "3", field: "building web apps",
  s1: "rebuilt the checkout in React, which cut drop-off by 18%", s2: "led the move to TypeScript across 40k lines of code", s3: "",
  why: "your focus on simple tools for small businesses",
};

const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length];

function compose(f: Form, seed: number) {
  const greet = f.manager.trim() ? `Dear ${f.manager.trim()},` : f.kind === "freelance" ? (f.tone === "formal" ? "Hello," : "Hi there,") : f.tone === "friendly" ? `Hello ${f.company} team,` : "Dear Hiring Manager,";
  const wins = [f.s1, f.s2, f.s3].map((s) => s.trim().replace(/\.$/, "")).filter(Boolean);
  const exp = f.years.trim() ? `${f.years.trim()} year${f.years.trim() === "1" ? "" : "s"} of` : "hands-on";

  const openers: Record<Tone, string[]> = {
    formal: [
      `I am writing to apply for the ${f.role} position at ${f.company}. With ${exp} experience in ${f.field}, I believe I can contribute from the first week.`,
      `Please accept this letter as my application for the ${f.role} role at ${f.company}. I bring ${exp} experience in ${f.field}.`,
    ],
    friendly: [
      `I was excited to see the ${f.role} opening at ${f.company}. I have ${exp} experience in ${f.field}, and this role looks like a great fit for what I do best.`,
      `When I saw that ${f.company} is hiring a ${f.role}, I knew I had to apply — I bring ${exp} experience in ${f.field}.`,
    ],
    confident: [
      `You need a ${f.role} who can deliver from day one. With ${exp} experience in ${f.field}, that is exactly what I offer ${f.company}.`,
      `I'm the ${f.role} ${f.company} is looking for: ${exp} experience in ${f.field} and a record of results to back it up.`,
    ],
  };
  if (f.kind === "freelance") {
    openers.formal = [`Thank you for sharing your project. I specialise in ${f.field} and have ${exp} experience delivering this kind of work for clients.`];
    openers.friendly = [`Thanks for posting this project — it's right in my lane. I've got ${exp} experience in ${f.field}, and I'd love to help.`];
    openers.confident = [`I can deliver this project. ${f.field.charAt(0).toUpperCase() + f.field.slice(1)} is what I do, with ${exp} experience and happy clients to show for it.`];
  }
  if (f.kind === "internship") {
    openers.formal = [`I am applying for the ${f.role} internship at ${f.company}. I am building my skills in ${f.field} and am eager to learn from your team.`];
    openers.friendly = [`I'd love to join ${f.company} as a ${f.role} intern. I've been building my skills in ${f.field} and I'm keen to learn from people who do it well.`];
    openers.confident = [`I'm ready to make an impact as a ${f.role} intern at ${f.company}. I've already put my skills in ${f.field} to work, and I learn fast.`];
  }

  const proofLead = pick(f.kind === "freelance" ? ["Recently, I", "In past projects, I"] : ["In my current role, I", "Most recently, I", "In my last role, I"], seed);
  const proof = wins.length
    ? wins.length === 1
      ? `${proofLead} ${wins[0]}.`
      : `${proofLead} ${wins.slice(0, -1).join(", ")} and ${wins[wins.length - 1]}.`
    : "";
  const fit = f.why.trim()
    ? pick([`What draws me to ${f.company} is ${f.why.trim().replace(/\.$/, "")}.`, `I'm especially drawn to ${f.company} because of ${f.why.trim().replace(/\.$/, "")}.`], seed)
    : "";
  const bridge = f.kind === "freelance"
    ? "I'll keep you updated at every step, stick to the agreed timeline and make sure the result does what you need."
    : pick(["I would bring the same focus on results, clear communication and ownership to your team.", "I'd bring that same mix of care, speed and ownership to your team."], seed);

  const close: Record<Tone, string> = {
    formal: f.kind === "freelance" ? "I would welcome the chance to discuss your project in more detail. Thank you for your time and consideration." : "I would welcome the opportunity to discuss how I can contribute to your team. Thank you for your time and consideration.",
    friendly: f.kind === "freelance" ? "Happy to jump on a quick call to talk through the details. Thanks for reading!" : "I'd love to chat about how I can help. Thanks so much for reading!",
    confident: f.kind === "freelance" ? "Let's set up a quick call this week — I can share a plan and timeline." : "I'd like to show you what I can do. Let's set up a time to talk this week.",
  };
  const sign = f.tone === "formal" ? "Sincerely," : f.tone === "friendly" ? "Best wishes," : "Best regards,";

  return [greet, pick(openers[f.tone], seed), [proof, bridge].filter(Boolean).join(" "), fit, close[f.tone], `${sign}\n${f.name}${f.contact ? `\n${f.contact}` : ""}`]
    .filter(Boolean)
    .join("\n\n");
}

async function toPdf(text: string, name: string) {
  const { newDoc, Writer } = await import("@/lib/pdfdoc");
  const { lib, doc, fonts } = await newDoc();
  const w = new Writer(doc, fonts, { size: [595.28, 841.89], margin: 64 });
  doc.setTitle(`Cover letter — ${name}`);
  doc.setCreator("ClientoraHQ Free Tools");
  w.text(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), { size: 10.5, color: lib.rgb(0.4, 0.43, 0.48) });
  w.space(18);
  for (const p of text.split("\n\n")) { w.text(p, { size: 11, color: lib.rgb(0.1, 0.12, 0.15), gap: 1.5 }); w.space(10); }
  return new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" });
}

export default function CoverLetter() {
  const [f, setF] = useLocal<Form>("cq-cover", START);
  const [seed, setSeed] = useState(0);
  const generated = useMemo(() => compose(f, seed), [f, seed]);
  const [text, setText] = useState(generated);
  const [edited, setEdited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!edited) setText(generated); }, [generated, edited]);
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Seg label="Letter type" value={f.kind} onChange={set("kind")} options={[{ value: "job", label: "Job" }, { value: "freelance", label: "Freelance proposal" }, { value: "internship", label: "Internship" }]} />
          <Seg label="Tone" value={f.tone} onChange={set("tone")} options={[{ value: "formal", label: "Formal" }, { value: "friendly", label: "Friendly" }, { value: "confident", label: "Confident" }]} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <In label={f.kind === "freelance" ? "Project / service" : "Job title"} v={f.role} on={set("role")} />
          <In label={f.kind === "freelance" ? "Client or company" : "Company"} v={f.company} on={set("company")} />
          <In label="Hiring manager (optional)" v={f.manager} on={set("manager")} placeholder="e.g. Ms Khan" />
          <In label="Years of experience" v={f.years} on={set("years")} />
          <In label="You are experienced in…" v={f.field} on={set("field")} wide placeholder="building web apps for startups" />
          <In label="Win #1 — what you did and the result" v={f.s1} on={set("s1")} wide />
          <In label="Win #2" v={f.s2} on={set("s2")} wide />
          <In label="Win #3 (optional)" v={f.s3} on={set("s3")} wide />
          <In label="Why this company / project?" v={f.why} on={set("why")} wide />
          <In label="Your name" v={f.name} on={set("name")} />
          <In label="Email / phone" v={f.contact} on={set("contact")} />
        </div>
      </div>

      <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between gap-2">
          <p className="field-label !mb-0">Your letter {edited && <span className="text-warn">(edited)</span>}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEdited(false); setSeed((s) => s + 1); }}><RefreshCw size={15} /> {edited ? "Regenerate" : "Another version"}</button>
        </div>
        <label htmlFor="letter" className="sr-only">Cover letter text</label>
        <textarea id="letter" value={text} onChange={(e) => { setText(e.target.value); setEdited(true); }} className="input min-h-[460px] !text-[15px] leading-relaxed" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={async () => {
            setBusy(true);
            try { downloadBlob(await toPdf(text, f.name), "cover-letter.pdf"); toast.success("Cover letter downloaded."); }
            catch { toast.error("Could not create the PDF."); }
            finally { setBusy(false); }
          }}>{busy ? <Spinner /> : <Download size={17} />} PDF</button>
          <button type="button" className="btn btn-ghost" onClick={() => downloadText(text, "cover-letter.txt")}><Download size={17} /> .txt</button>
          <CopyButton text={text} className="btn btn-ghost" />
        </div>
        <p className="text-[12.5px] text-fg-3">Read it once and change a line or two so it sounds like you.</p>
      </div>
    </div>
  );
}

function In({ label, v, on, wide, placeholder }: { label: string; v: string; on: (v: string) => void; wide?: boolean; placeholder?: string }) {
  const id = useId();
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input id={id} className="input" value={v} placeholder={placeholder} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
