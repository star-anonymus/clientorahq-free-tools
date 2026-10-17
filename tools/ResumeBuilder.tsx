"use client";
import { useId, useState } from "react";
import { Download, Plus, Trash2, Lightbulb, ArrowUp, ArrowDown } from "lucide-react";
import { IconBtn, Seg, Spinner } from "@/components/ui/kit";
import { downloadBlob, moveItem } from "@/lib/files";
import { useLocal } from "@/lib/store";
import { toast } from "@/lib/toast";

interface Job { id: string; role: string; company: string; place: string; start: string; end: string; bullets: string }
interface Edu { id: string; degree: string; school: string; year: string; detail: string }
interface Resume {
  name: string; headline: string; email: string; phone: string; location: string; links: string; summary: string;
  jobs: Job[]; edu: Edu[]; skills: string; extraTitle: string; extra: string; template: "classic" | "modern"; accent: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

// Proven bullet shapes: action verb + what + measurable result. [brackets] are for the user to fill.
const IDEAS: Record<string, string[]> = {
  "Software developer": [
    "Built [feature] in [React/Node] used by [N] users, cutting [load time/support tickets] by [X%]",
    "Designed and shipped a REST API handling [N] requests a day with [99.9%] uptime",
    "Reduced page load time from [X s] to [Y s] by [code-splitting/caching/query optimisation]",
    "Automated [deploys/tests] with [GitHub Actions], saving the team [N] hours a week",
    "Mentored [N] junior developers through code reviews and pair programming",
  ],
  Designer: [
    "Redesigned [product/page], lifting [conversion/sign-ups] by [X%] in [N] weeks",
    "Created a design system of [N] components used across [N] products",
    "Ran [N] user interviews and usability tests that shaped the [feature] roadmap",
    "Delivered brand identities for [N] clients, from logo to launch",
  ],
  "Marketing": [
    "Grew organic traffic from [X] to [Y] monthly visits in [N] months through SEO and content",
    "Managed a [$X] monthly ad budget at a [X]x return on ad spend",
    "Launched an email programme reaching [N] subscribers with a [X%] open rate",
    "Planned and published [N] posts a week, growing followers by [X%]",
  ],
  "Sales / business development": [
    "Generated [$X] in new revenue by closing [N] deals in [period]",
    "Booked [N] qualified meetings a month through LinkedIn and cold email outreach",
    "Exceeded quota by [X%] for [N] consecutive quarters",
    "Built a pipeline of [N] leads using [CRM/ClientoraHQ], with a [X%] reply rate",
  ],
  "Freelancer": [
    "Delivered [N] projects for clients in [N] countries with a [5.0] average rating",
    "Kept a [X%] repeat-client rate by delivering on time and communicating weekly",
    "Built [type of product] for [client], which [result for the client]",
  ],
  "Customer support": [
    "Resolved [N] tickets a week with a [X%] customer satisfaction score",
    "Cut average response time from [X h] to [Y h] by writing [N] help-centre articles",
    "Trained [N] new support agents on tools and tone",
  ],
  General: [
    "Led [project] from start to finish, delivering [result] [N weeks] ahead of schedule",
    "Improved [process], saving [N hours/$X] a [week/month]",
    "Collaborated with [teams] to [achieve result]",
  ],
};

const SAMPLE: Resume = {
  name: "Your Name", headline: "Full-Stack Developer", email: "you@email.com", phone: "+92 300 0000000", location: "Rawalpindi, Pakistan",
  links: "linkedin.com/in/you · github.com/you", summary: "Developer with [N] years of experience building fast, reliable web apps. I enjoy turning messy problems into simple products people like to use.",
  jobs: [{ id: "j1", role: "Full-Stack Developer", company: "Company name", place: "Remote", start: "Jan 2023", end: "Present", bullets: "Built [feature] in [React/Node] used by [N] users, cutting [load time] by [X%]\nDesigned and shipped a REST API handling [N] requests a day" }],
  edu: [{ id: "e1", degree: "BS Computer Science", school: "University name", year: "2022", detail: "" }],
  skills: "TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, Git", extraTitle: "Projects", extra: "", template: "modern", accent: "#0e7490",
};

async function buildPdf(r: Resume) {
  const { newDoc, hexRgb, Writer, safe } = await import("@/lib/pdfdoc");
  const { lib, doc, fonts } = await newDoc();
  const ink = lib.rgb(0.1, 0.12, 0.15);
  const grey = lib.rgb(0.38, 0.42, 0.47);
  const accent = r.template === "modern" ? hexRgb(lib, r.accent) : ink;
  const w = new Writer(doc, fonts, { size: [595.28, 841.89], margin: 46 });
  doc.setTitle(`${r.name} — Resume`);
  doc.setAuthor(r.name);
  doc.setCreator("ClientoraHQ Free Tools");

  const center = r.template === "classic";
  w.text(r.name, { size: 24, font: fonts.bold, color: accent, align: center ? "center" : "left" });
  if (r.headline) w.text(r.headline, { size: 12, color: grey, align: center ? "center" : "left" });
  w.space(3);
  const contact = [r.email, r.phone, r.location, r.links].filter(Boolean).join("  |  ");
  if (contact) w.text(contact, { size: 9.5, color: ink, align: center ? "center" : "left" });
  w.space(10);

  const section = (title: string) => {
    w.ensure(40);
    w.space(6);
    w.text(title.toUpperCase(), { size: 10.5, font: fonts.bold, color: accent, gap: 1.2 });
    w.space(2);
    w.rule(r.template === "modern" ? accent : lib.rgb(0.75, 0.77, 0.8), r.template === "modern" ? 1.2 : 0.7);
    w.space(8);
  };
  const bullets = (text: string) => {
    for (const b of text.split("\n").map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean)) {
      w.ensure(14);
      w.page.drawText(safe(fonts.regular, "•"), { x: w.left + 4, y: w.y - 10, size: 10, font: fonts.regular, color: ink });
      w.text(b, { size: 10, x: w.left + 16, color: ink, gap: 1.35 });
      w.space(1.5);
    }
  };
  const twoCol = (left: string, right: string, size = 10.5) => {
    w.ensure(size * 1.5);
    const rw = fonts.regular.widthOfTextAtSize(safe(fonts.regular, right), 9.5);
    const y = w.y;
    w.text(left, { size, font: fonts.bold, color: ink, width: w.width - rw - 12 });
    if (right) w.page.drawText(safe(fonts.regular, right), { x: w.left + w.width - rw, y: y - size, size: 9.5, font: fonts.regular, color: grey });
  };

  if (r.summary.trim()) { section("Summary"); w.text(r.summary, { size: 10, color: ink, gap: 1.45 }); }
  const jobs = r.jobs.filter((j) => j.role || j.company);
  if (jobs.length) {
    section("Experience");
    for (const j of jobs) {
      twoCol(j.role, [j.start, j.end].filter(Boolean).join(" – "));
      const sub = [j.company, j.place].filter(Boolean).join(", ");
      if (sub) w.text(sub, { size: 10, font: fonts.italic, color: grey });
      w.space(3);
      bullets(j.bullets);
      w.space(7);
    }
  }
  const edu = r.edu.filter((e) => e.degree || e.school);
  if (edu.length) {
    section("Education");
    for (const e of edu) {
      twoCol(e.degree, e.year);
      if (e.school) w.text(e.school, { size: 10, font: fonts.italic, color: grey });
      if (e.detail) w.text(e.detail, { size: 10, color: ink });
      w.space(6);
    }
  }
  if (r.skills.trim()) { section("Skills"); w.text(r.skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).join("  ·  "), { size: 10, color: ink, gap: 1.5 }); }
  if (r.extra.trim()) { section(r.extraTitle || "Projects"); bullets(r.extra); }
  return new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" });
}

export default function ResumeBuilder() {
  const [r, setR] = useLocal<Resume>("cq-resume", SAMPLE);
  const [ideaFor, setIdeaFor] = useState<string | null>(null);
  const [field, setField] = useState(Object.keys(IDEAS)[0]);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Resume>(k: K, v: Resume[K]) => setR((p) => ({ ...p, [k]: v }));
  const setJob = (id: string, patch: Partial<Job>) => setR((p) => ({ ...p, jobs: p.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
  const setEdu = (id: string, patch: Partial<Edu>) => setR((p) => ({ ...p, edu: p.edu.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const unfilled = JSON.stringify(r).match(/\[[^\]]+\]/g)?.length ?? 0;

  return (
    <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Group title="About you">
          <div className="grid gap-3 sm:grid-cols-2">
            <In label="Full name" v={r.name} on={(v) => set("name", v)} />
            <In label="Headline" v={r.headline} on={(v) => set("headline", v)} />
            <In label="Email" v={r.email} on={(v) => set("email", v)} />
            <In label="Phone" v={r.phone} on={(v) => set("phone", v)} />
            <In label="City, country" v={r.location} on={(v) => set("location", v)} />
            <In label="Links (LinkedIn, portfolio)" v={r.links} on={(v) => set("links", v)} />
          </div>
          <Area label="Summary (2–3 lines)" v={r.summary} on={(v) => set("summary", v)} rows={3} />
        </Group>

        <Group title="Experience" action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setR((p) => ({ ...p, jobs: [...p.jobs, { id: uid(), role: "", company: "", place: "", start: "", end: "", bullets: "" }] }))}><Plus size={15} /> Add job</button>}>
          {r.jobs.map((j, i) => (
            <div key={j.id} className="space-y-3 rounded-xl border border-line bg-bg/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-fg-3">Job {i + 1}</p>
                <div className="flex">
                  <IconBtn label="Move job up" disabled={i === 0} onClick={() => set("jobs", moveItem(r.jobs, i, i - 1))}><ArrowUp size={15} /></IconBtn>
                  <IconBtn label="Move job down" disabled={i === r.jobs.length - 1} onClick={() => set("jobs", moveItem(r.jobs, i, i + 1))}><ArrowDown size={15} /></IconBtn>
                  <IconBtn label="Remove job" onClick={() => set("jobs", r.jobs.filter((x) => x.id !== j.id))}><Trash2 size={15} /></IconBtn>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <In label="Job title" v={j.role} on={(v) => setJob(j.id, { role: v })} />
                <In label="Company" v={j.company} on={(v) => setJob(j.id, { company: v })} />
                <In label="Location" v={j.place} on={(v) => setJob(j.id, { place: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <In label="Start" v={j.start} on={(v) => setJob(j.id, { start: v })} />
                  <In label="End" v={j.end} on={(v) => setJob(j.id, { end: v })} />
                </div>
              </div>
              <Area label="Achievements — one per line" v={j.bullets} on={(v) => setJob(j.id, { bullets: v })} rows={4} />
              <button type="button" className="btn btn-ghost btn-sm" aria-expanded={ideaFor === j.id} onClick={() => setIdeaFor(ideaFor === j.id ? null : j.id)}><Lightbulb size={15} /> Bullet ideas</button>
              {ideaFor === j.id && (
                <div className="space-y-2 rounded-xl border border-warn/30 bg-warn/[0.05] p-3">
                  <select aria-label="Field" className="input" value={field} onChange={(e) => setField(e.target.value)}>
                    {Object.keys(IDEAS).map((k) => <option key={k}>{k}</option>)}
                  </select>
                  <ul className="space-y-1">
                    {IDEAS[field].map((b) => (
                      <li key={b}>
                        <button type="button" className="w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-[13.5px] text-fg-2 hover:bg-cyan/10 hover:text-fg" onClick={() => setJob(j.id, { bullets: (j.bullets.trim() ? `${j.bullets.trim()}\n` : "") + b })}>
                          + {b}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[12.5px] text-fg-3">Replace every [bracket] with your real numbers — results beat duties.</p>
                </div>
              )}
            </div>
          ))}
        </Group>

        <Group title="Education" action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setR((p) => ({ ...p, edu: [...p.edu, { id: uid(), degree: "", school: "", year: "", detail: "" }] }))}><Plus size={15} /> Add</button>}>
          {r.edu.map((e) => (
            <div key={e.id} className="grid gap-3 rounded-xl border border-line bg-bg/40 p-3 sm:grid-cols-[1fr_1fr_90px_40px] sm:items-end">
              <In label="Degree" v={e.degree} on={(v) => setEdu(e.id, { degree: v })} />
              <In label="School" v={e.school} on={(v) => setEdu(e.id, { school: v })} />
              <In label="Year" v={e.year} on={(v) => setEdu(e.id, { year: v })} />
              <IconBtn label="Remove education" onClick={() => set("edu", r.edu.filter((x) => x.id !== e.id))}><Trash2 size={15} /></IconBtn>
            </div>
          ))}
        </Group>

        <Group title="Skills & more">
          <Area label="Skills (comma separated)" v={r.skills} on={(v) => set("skills", v)} rows={2} />
          <In label="Extra section title" v={r.extraTitle} on={(v) => set("extraTitle", v)} />
          <Area label="Extra section — one item per line (projects, certificates, languages)" v={r.extra} on={(v) => set("extra", v)} rows={3} />
        </Group>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-wrap items-center gap-3">
          <Seg label="Template" value={r.template} onChange={(v) => set("template", v)} options={[{ value: "modern", label: "Modern" }, { value: "classic", label: "Classic" }]} />
          {r.template === "modern" && <input type="color" aria-label="Accent colour" value={r.accent} onChange={(e) => set("accent", e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line-hi bg-transparent p-1" />}
        </div>
        <Preview r={r} />
        {unfilled > 0 && <p className="rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-[13.5px] text-warn">{unfilled} [bracket] placeholder{unfilled > 1 ? "s" : ""} still to replace with your own details.</p>}
        <button type="button" className="btn btn-primary btn-lg w-full" disabled={busy} onClick={async () => {
          setBusy(true);
          try { downloadBlob(await buildPdf(r), `${(r.name || "resume").replace(/\s+/g, "-")}-Resume.pdf`); toast.success("Resume downloaded."); }
          catch { toast.error("Could not create the PDF."); }
          finally { setBusy(false); }
        }}>{busy ? <Spinner /> : <Download size={20} />} Download PDF</button>
        <p className="text-center text-[12.5px] text-fg-3">Saved automatically in this browser.</p>
      </aside>
    </div>
  );
}

function Preview({ r }: { r: Resume }) {
  const accent = r.template === "modern" ? r.accent : "#1a1f26";
  const center = r.template === "classic";
  const H = ({ t }: { t: string }) => <p className="mb-1 mt-3 border-b pb-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: accent, borderColor: r.template === "modern" ? accent : "#c0c4ca" }}>{t}</p>;
  return (
    <div className="max-h-[560px] overflow-auto rounded-xl bg-white p-5 text-[10px] leading-snug text-[#1a1f26] shadow-2xl shadow-black/40" aria-label="Resume preview">
      <p className={`text-[18px] font-bold ${center ? "text-center" : ""}`} style={{ color: accent }}>{r.name}</p>
      <p className={`text-[11px] text-[#5f6670] ${center ? "text-center" : ""}`}>{r.headline}</p>
      <p className={`mt-1 ${center ? "text-center" : ""}`}>{[r.email, r.phone, r.location, r.links].filter(Boolean).join(" | ")}</p>
      {r.summary && <><H t="Summary" /><p>{r.summary}</p></>}
      {r.jobs.length > 0 && <H t="Experience" />}
      {r.jobs.map((j) => (
        <div key={j.id} className="mb-2">
          <p className="flex justify-between gap-2 font-bold"><span>{j.role}</span><span className="font-normal text-[#5f6670]">{[j.start, j.end].filter(Boolean).join(" – ")}</span></p>
          <p className="italic text-[#5f6670]">{[j.company, j.place].filter(Boolean).join(", ")}</p>
          <ul className="ml-3 list-disc">{j.bullets.split("\n").filter((b) => b.trim()).map((b, i) => <li key={i}>{b.replace(/^[-•*]\s*/, "")}</li>)}</ul>
        </div>
      ))}
      {r.edu.length > 0 && <H t="Education" />}
      {r.edu.map((e) => <div key={e.id} className="mb-1"><p className="flex justify-between font-bold"><span>{e.degree}</span><span className="font-normal text-[#5f6670]">{e.year}</span></p><p className="italic text-[#5f6670]">{e.school}</p></div>)}
      {r.skills && <><H t="Skills" /><p>{r.skills.split(",").map((s) => s.trim()).filter(Boolean).join(" · ")}</p></>}
      {r.extra && <><H t={r.extraTitle || "Projects"} /><ul className="ml-3 list-disc">{r.extra.split("\n").filter((b) => b.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul></>}
    </div>
  );
}

function Group({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h3 className="text-[17px] font-bold">{title}</h3>{action}</div>
      {children}
    </section>
  );
}
function In({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  const id = useId();
  return <div><label className="field-label" htmlFor={id}>{label}</label><input id={id} className="input" value={v} onChange={(e) => on(e.target.value)} /></div>;
}
function Area({ label, v, on, rows }: { label: string; v: string; on: (v: string) => void; rows: number }) {
  const id = useId();
  return <div><label className="field-label" htmlFor={id}>{label}</label><textarea id={id} className="input" rows={rows} value={v} onChange={(e) => on(e.target.value)} /></div>;
}
