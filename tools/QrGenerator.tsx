"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, Link2, Wifi, Contact, MessageCircle, Mail, Type, Phone } from "lucide-react";
import { CopyButton, Seg } from "@/components/ui/kit";
import { downloadBlob, downloadText } from "@/lib/files";
import { contrast, isHex } from "@/lib/color";

type Kind = "url" | "wifi" | "vcard" | "whatsapp" | "email" | "text" | "sms";

const KINDS: { id: Kind; label: string; icon: React.ReactNode }[] = [
  { id: "url", label: "Link", icon: <Link2 size={16} /> },
  { id: "wifi", label: "Wi-Fi", icon: <Wifi size={16} /> },
  { id: "vcard", label: "Contact", icon: <Contact size={16} /> },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={16} /> },
  { id: "email", label: "Email", icon: <Mail size={16} /> },
  { id: "sms", label: "SMS", icon: <Phone size={16} /> },
  { id: "text", label: "Text", icon: <Type size={16} /> },
];

// Wi-Fi strings escape \ ; , : and " with a backslash.
const wesc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
const digits = (s: string) => s.replace(/[^\d]/g, "");

export default function QrGenerator() {
  const [kind, setKind] = useState<Kind>("url");
  const [f, setF] = useState<Record<string, string>>({ url: "https://clientorahq.com", enc: "WPA", country: "" });
  const [fg, setFg] = useState("#01121c");
  const [bg, setBg] = useState("#ffffff");
  const [ecl, setEcl] = useState<"L" | "M" | "Q" | "H">("M");
  const [size, setSize] = useState(1024);
  const [margin, setMargin] = useState(2);
  const [svg, setSvg] = useState("");
  const [png, setPng] = useState("");
  const [err, setErr] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const v = (k: string) => f[k] ?? "";

  const data = useMemo(() => {
    switch (kind) {
      case "url": return v("url").trim();
      case "text": return v("text");
      case "wifi": return v("ssid") ? `WIFI:T:${v("enc") === "nopass" ? "nopass" : v("enc")};S:${wesc(v("ssid"))};${v("enc") === "nopass" ? "" : `P:${wesc(v("pass"))};`}${v("hidden") === "1" ? "H:true;" : ""};` : "";
      case "vcard": {
        if (!v("first") && !v("last")) return "";
        const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${v("last")};${v("first")};;;`, `FN:${`${v("first")} ${v("last")}`.trim()}`];
        if (v("org")) lines.push(`ORG:${v("org")}`);
        if (v("title")) lines.push(`TITLE:${v("title")}`);
        if (v("phone")) lines.push(`TEL;TYPE=CELL:${v("phone")}`);
        if (v("vemail")) lines.push(`EMAIL:${v("vemail")}`);
        if (v("site")) lines.push(`URL:${v("site")}`);
        lines.push("END:VCARD");
        return lines.join("\n");
      }
      case "whatsapp": return digits(v("wa")) ? `https://wa.me/${digits(v("wa"))}${v("wamsg") ? `?text=${encodeURIComponent(v("wamsg"))}` : ""}` : "";
      case "email": return v("to") ? `mailto:${v("to")}${v("subj") || v("body") ? `?${new URLSearchParams({ ...(v("subj") && { subject: v("subj") }), ...(v("body") && { body: v("body") }) }).toString().replace(/\+/g, "%20")}` : ""}` : "";
      case "sms": return v("smsto") ? `SMSTO:${v("smsto")}:${v("smsmsg")}` : "";
    }
  }, [kind, f]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data) { setSvg(""); setPng(""); return; }
    if (!isHex(fg) || !isHex(bg)) return; // wait until a colour is fully typed
    let live = true;
    import("qrcode").then(async (QR) => {
      try {
        const opts = { errorCorrectionLevel: ecl, margin, color: { dark: fg, light: bg } };
        const [s, p] = await Promise.all([QR.toString(data, { ...opts, type: "svg" }), QR.toDataURL(data, { ...opts, width: size })]);
        if (live) { setSvg(s); setPng(p); setErr(""); }
      } catch {
        if (live) setErr("That is too much data for one QR code. Shorten it.");
      }
    });
    return () => { live = false; };
  }, [data, fg, bg, ecl, size, margin]);

  const lowContrast = contrast(fg, bg) < 3;

  return (
    <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="QR code type">
          {KINDS.map((k) => (
            <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className={`btn btn-sm ${kind === k.id ? "btn-primary" : "btn-ghost"}`}>{k.icon} {k.label}</button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {kind === "url" && <In id="url" label="Website or link" v={v("url")} on={set("url")} wide placeholder="https://" type="url" />}
          {kind === "text" && <div className="sm:col-span-2"><label className="field-label" htmlFor="text">Text</label><textarea id="text" className="input min-h-32" value={v("text")} onChange={set("text")} /></div>}
          {kind === "wifi" && (<>
            <In id="ssid" label="Network name (SSID)" v={v("ssid")} on={set("ssid")} />
            <In id="pass" label="Password" v={v("pass")} on={set("pass")} disabled={v("enc") === "nopass"} />
            <div><label className="field-label" htmlFor="enc">Security</label><select id="enc" className="input" value={v("enc")} onChange={set("enc")}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end text-[14.5px]"><input type="checkbox" className="check" checked={v("hidden") === "1"} onChange={(e) => setF((p) => ({ ...p, hidden: e.target.checked ? "1" : "" }))} /> Hidden network</label>
          </>)}
          {kind === "vcard" && (<>
            <In id="first" label="First name" v={v("first")} on={set("first")} />
            <In id="last" label="Last name" v={v("last")} on={set("last")} />
            <In id="org" label="Company" v={v("org")} on={set("org")} />
            <In id="title" label="Job title" v={v("title")} on={set("title")} />
            <In id="phone" label="Phone" v={v("phone")} on={set("phone")} type="tel" />
            <In id="vemail" label="Email" v={v("vemail")} on={set("vemail")} type="email" />
            <In id="site" label="Website" v={v("site")} on={set("site")} wide type="url" />
          </>)}
          {kind === "whatsapp" && (<>
            <In id="wa" label="Phone with country code" v={v("wa")} on={set("wa")} placeholder="923001234567" type="tel" />
            <In id="wamsg" label="Message (optional)" v={v("wamsg")} on={set("wamsg")} />
          </>)}
          {kind === "email" && (<>
            <In id="to" label="To" v={v("to")} on={set("to")} type="email" />
            <In id="subj" label="Subject" v={v("subj")} on={set("subj")} />
            <div className="sm:col-span-2"><label className="field-label" htmlFor="body">Message</label><textarea id="body" className="input min-h-24" value={v("body")} onChange={set("body")} /></div>
          </>)}
          {kind === "sms" && (<>
            <In id="smsto" label="Phone number" v={v("smsto")} on={set("smsto")} type="tel" />
            <In id="smsmsg" label="Message" v={v("smsmsg")} on={set("smsmsg")} />
          </>)}
        </div>

        <details className="rounded-2xl border border-line bg-bg/40 p-4" open>
          <summary className="cursor-pointer text-[14.5px] font-semibold">Design</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Color id="fg" label="Code colour" v={fg} set={setFg} />
            <Color id="bg" label="Background" v={bg} set={setBg} />
            <div>
              <p className="field-label">Error correction</p>
              <Seg label="Error correction" value={ecl} onChange={setEcl} options={[{ value: "L", label: "Low" }, { value: "M", label: "Medium" }, { value: "Q", label: "High" }, { value: "H", label: "Max" }]} />
            </div>
            <div>
              <label className="field-label flex justify-between" htmlFor="margin">Quiet zone <span className="font-mono text-cyan">{margin}</span></label>
              <input id="margin" type="range" min={0} max={8} value={margin} onChange={(e) => setMargin(+e.target.value)} className="range" />
            </div>
          </div>
          {lowContrast && <p className="mt-3 text-[13.5px] text-warn">Low contrast — many phones won't scan this. Use a dark code on a light background.</p>}
        </details>
      </div>

      <aside className="flex flex-col items-center gap-4 lg:self-start">
        <div className="grid aspect-square w-full max-w-[300px] place-items-center rounded-2xl border border-line bg-white/5 p-3">
          {svg ? <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" role="img" aria-label="QR code preview" dangerouslySetInnerHTML={{ __html: svg }} />
            : <p className="px-6 text-center text-[14px] text-fg-3">{err || "Fill in the details to see your QR code."}</p>}
        </div>
        <div className="w-full max-w-[300px]">
          <label className="field-label" htmlFor="size">PNG size</label>
          <select id="size" className="input" value={size} onChange={(e) => setSize(+e.target.value)}>
            {[256, 512, 1024, 2048].map((n) => <option key={n} value={n}>{n} × {n} px</option>)}
          </select>
        </div>
        <div className="flex w-full max-w-[300px] flex-col gap-2">
          <button type="button" className="btn btn-primary" disabled={!png} onClick={async () => downloadBlob(await (await fetch(png)).blob(), "qr-code.png")}><Download size={18} /> Download PNG</button>
          <button type="button" className="btn btn-ghost" disabled={!svg} onClick={() => downloadText(svg, "qr-code.svg", "image/svg+xml")}><Download size={18} /> Download SVG</button>
          {data && <CopyButton text={data} label="Copy encoded text" />}
        </div>
      </aside>
    </div>
  );
}

function In({ id, label, v, on, wide, placeholder, type = "text", disabled }: { id: string; label: string; v: string; on: React.ChangeEventHandler<HTMLInputElement>; wide?: boolean; placeholder?: string; type?: string; disabled?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input id={id} type={type} className="input" value={v} onChange={on} placeholder={placeholder} disabled={disabled} />
    </div>
  );
}

function Color({ id, label, v, set }: { id: string; label: string; v: string; set: (s: string) => void }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="flex gap-2">
        <input type="color" aria-label={`${label} picker`} value={v} onChange={(e) => set(e.target.value)} className="h-11 w-12 flex-none cursor-pointer rounded-lg border border-line-hi bg-transparent p-1" />
        <input id={id} className="input font-mono" value={v} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && set(e.target.value)} />
      </div>
    </div>
  );
}
