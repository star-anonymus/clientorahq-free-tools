"use client";
import { useMemo, useState } from "react";
import { Download, Plus, Trash2, ImagePlus, X, RotateCcw } from "lucide-react";
import { IconBtn, Spinner } from "@/components/ui/kit";
import { downloadBlob } from "@/lib/files";
import { useLocal } from "@/lib/store";
import { toast } from "@/lib/toast";

interface Item { id: string; desc: string; qty: number; rate: number }
interface Invoice {
  number: string; issued: string; due: string; currency: string; accent: string;
  from: string; to: string; items: Item[]; taxPct: number; discount: number; notes: string; payment: string; logo: string;
}

const CURRENCIES: [string, string][] = [
  ["USD", "$"], ["EUR", "€"], ["GBP", "£"], ["PKR", "Rs"], ["INR", "₹"], ["AED", "AED"], ["SAR", "SAR"], ["CAD", "CA$"], ["AUD", "A$"],
  ["NZD", "NZ$"], ["SGD", "S$"], ["MYR", "RM"], ["BDT", "৳"], ["LKR", "Rs"], ["NGN", "₦"], ["KES", "KSh"], ["ZAR", "R"], ["EGP", "E£"],
  ["TRY", "₺"], ["JPY", "¥"], ["CNY", "¥"], ["PHP", "₱"], ["IDR", "Rp"], ["BRL", "R$"], ["MXN", "MX$"], ["CHF", "CHF"], ["SEK", "kr"],
  ["NOK", "kr"], ["DKK", "kr"], ["PLN", "zł"], ["QAR", "QAR"], ["KWD", "KWD"],
];

const today = () => new Date().toISOString().slice(0, 10);
const plus = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

const BLANK: Invoice = {
  number: "INV-001", issued: today(), due: plus(14), currency: "USD", accent: "#0e7490",
  from: "Your name or business\nAddress\nemail@example.com", to: "Client name\nCompany\nAddress",
  items: [{ id: "a", desc: "Website design — 5 pages", qty: 1, rate: 800 }, { id: "b", desc: "Hosting setup", qty: 1, rate: 50 }],
  taxPct: 0, discount: 0, notes: "Thank you for your business.", payment: "Bank: \nAccount name: \nIBAN: ", logo: "",
};

function money(n: number, cur: string) {
  const sym = CURRENCIES.find((c) => c[0] === cur)?.[1] ?? cur;
  const num = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sym.length > 2 && sym === cur ? `${cur} ${num}` : `${sym}${num}`;
}

function totals(inv: Invoice) {
  const sub = inv.items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
  const disc = Math.min(sub, inv.discount || 0);
  const tax = ((sub - disc) * (inv.taxPct || 0)) / 100;
  return { sub, disc, tax, total: sub - disc + tax };
}

async function buildPdf(inv: Invoice) {
  const { newDoc, hexRgb, Writer, safe } = await import("@/lib/pdfdoc");
  const { lib, doc, fonts } = await newDoc();
  const accent = hexRgb(lib, inv.accent);
  const ink = lib.rgb(0.1, 0.12, 0.15);
  const grey = lib.rgb(0.42, 0.45, 0.5);
  const line = lib.rgb(0.86, 0.88, 0.9);
  const w = new Writer(doc, fonts);
  const { sub, disc, tax, total } = totals(inv);
  // PDF can't draw ₹, ৳ etc. with built-in fonts, so fall back to the currency code.
  const sym = CURRENCIES.find((c) => c[0] === inv.currency)?.[1] ?? inv.currency;
  const m = (n: number) => (safe(fonts.regular, sym) === sym ? money(n, inv.currency) : `${inv.currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  doc.setTitle(`Invoice ${inv.number}`);
  doc.setCreator("ClientoraHQ Free Tools");
  w.page.drawRectangle({ x: 0, y: w.opts.size[1] - 8, width: w.opts.size[0], height: 8, color: accent });

  const top = w.y;
  let logoH = 0;
  if (inv.logo) {
    try {
      const bytes = await (await fetch(inv.logo)).arrayBuffer();
      const img = inv.logo.startsWith("data:image/png") ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const s = Math.min(150 / img.width, 54 / img.height);
      logoH = img.height * s;
      w.page.drawImage(img, { x: w.left, y: top - logoH, width: img.width * s, height: logoH });
    } catch { /* skip a logo we can't read */ }
  }
  w.text("INVOICE", { size: 26, font: fonts.bold, color: accent, align: "right" });
  w.text(`# ${inv.number}`, { size: 11, color: grey, align: "right" });
  w.y = Math.min(w.y, top - logoH) - 18;

  // From / Bill to / dates
  const colW = (w.width - 20) / 3;
  const startY = w.y;
  const block = (title: string, body: string, x: number) => {
    w.y = startY;
    w.text(title.toUpperCase(), { size: 8.5, font: fonts.bold, color: grey, x, width: colW });
    w.space(2);
    w.text(body, { size: 10, color: ink, x, width: colW });
    return w.y;
  };
  const y1 = block("From", inv.from, w.left);
  const y2 = block("Bill to", inv.to, w.left + colW + 10);
  const y3 = block("Dates", `Issued: ${fmtDate(inv.issued)}\nDue: ${fmtDate(inv.due)}`, w.left + (colW + 10) * 2);
  w.y = Math.min(y1, y2, y3) - 20;

  // Items table
  const cols = { desc: w.left + 8, qty: w.left + w.width * 0.58, rate: w.left + w.width * 0.7, amt: w.left + w.width - 8 };
  const header = () => {
    w.ensure(28);
    w.page.drawRectangle({ x: w.left, y: w.y - 22, width: w.width, height: 22, color: accent, opacity: 0.1 });
    const hy = w.y - 15;
    w.page.drawText("DESCRIPTION", { x: cols.desc, y: hy, size: 8.5, font: fonts.bold, color: ink });
    w.page.drawText("QTY", { x: cols.qty, y: hy, size: 8.5, font: fonts.bold, color: ink });
    w.page.drawText("RATE", { x: cols.rate, y: hy, size: 8.5, font: fonts.bold, color: ink });
    const aw = fonts.bold.widthOfTextAtSize("AMOUNT", 8.5);
    w.page.drawText("AMOUNT", { x: cols.amt - aw, y: hy, size: 8.5, font: fonts.bold, color: ink });
    w.y -= 30;
  };
  header();
  for (const it of inv.items.filter((i) => i.desc || i.rate)) {
    const rowTop = w.y;
    w.ensure(18);
    if (w.y > rowTop) header(); // new page started: repeat the header
    const y0 = w.y;
    w.text(it.desc || "—", { size: 10, x: cols.desc, width: cols.qty - cols.desc - 12, color: ink });
    const amount = m((it.qty || 0) * (it.rate || 0));
    w.page.drawText(String(it.qty ?? 0), { x: cols.qty, y: y0 - 10, size: 10, font: fonts.regular, color: ink });
    w.page.drawText(safe(fonts.regular, m(it.rate || 0)), { x: cols.rate, y: y0 - 10, size: 10, font: fonts.regular, color: ink });
    const aw = fonts.regular.widthOfTextAtSize(safe(fonts.regular, amount), 10);
    w.page.drawText(safe(fonts.regular, amount), { x: cols.amt - aw, y: y0 - 10, size: 10, font: fonts.regular, color: ink });
    w.space(6);
    w.rule(line, 0.6);
    w.space(10);
  }

  // Totals
  const tx = w.left + w.width * 0.55;
  const tw = w.width * 0.45 - 8;
  const row = (label: string, value: string, bold = false, size = 10) => {
    w.ensure(size * 1.8);
    const f = bold ? fonts.bold : fonts.regular;
    w.page.drawText(label, { x: tx, y: w.y - size, size, font: f, color: bold ? ink : grey });
    const v = safe(f, value);
    w.page.drawText(v, { x: tx + tw - f.widthOfTextAtSize(v, size), y: w.y - size, size, font: f, color: ink });
    w.y -= size * 1.8;
  };
  w.space(4);
  row("Subtotal", m(sub));
  if (disc) row("Discount", `-${m(disc)}`);
  if (inv.taxPct) row(`Tax (${inv.taxPct}%)`, m(tax));
  w.space(2);
  w.ensure(30);
  w.page.drawRectangle({ x: tx - 8, y: w.y - 26, width: tw + 16, height: 28, color: accent });
  const tot = safe(fonts.bold, m(total));
  w.page.drawText("Total due", { x: tx, y: w.y - 17, size: 11, font: fonts.bold, color: lib.rgb(1, 1, 1) });
  w.page.drawText(tot, { x: tx + tw - fonts.bold.widthOfTextAtSize(tot, 13), y: w.y - 18, size: 13, font: fonts.bold, color: lib.rgb(1, 1, 1) });
  w.y -= 48;

  if (inv.payment.trim()) {
    w.text("PAYMENT DETAILS", { size: 8.5, font: fonts.bold, color: grey });
    w.space(2);
    w.text(inv.payment, { size: 10, color: ink });
    w.space(12);
  }
  if (inv.notes.trim()) {
    w.text("NOTES", { size: 8.5, font: fonts.bold, color: grey });
    w.space(2);
    w.text(inv.notes, { size: 10, color: ink });
  }
  return new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" });
}

function fmtDate(s: string) {
  const d = new Date(`${s}T00:00:00`);
  return isNaN(+d) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function InvoiceGenerator() {
  const [inv, setInv] = useLocal<Invoice>("cq-invoice", BLANK);
  const [busy, setBusy] = useState(false);
  const t = useMemo(() => totals(inv), [inv]);
  const set = <K extends keyof Invoice>(k: K, v: Invoice[K]) => setInv((p) => ({ ...p, [k]: v }));
  const setItem = (id: string, patch: Partial<Item>) => setInv((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const download = async () => {
    setBusy(true);
    try {
      downloadBlob(await buildPdf(inv), `invoice-${inv.number.replace(/[^\w-]+/g, "_") || "draft"}.pdf`);
      // Bump the number for next time: INV-001 → INV-002.
      setInv((p) => ({ ...p, number: p.number.replace(/(\d+)(?!.*\d)/, (d) => String(+d + 1).padStart(d.length, "0")) }));
      toast.success("Invoice downloaded. Next number is ready.");
    } catch {
      toast.error("Could not create the PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <F label="Invoice #" id="num"><input id="num" className="input" value={inv.number} onChange={(e) => set("number", e.target.value)} /></F>
          <F label="Issued" id="iss"><input id="iss" type="date" className="input" value={inv.issued} onChange={(e) => set("issued", e.target.value)} /></F>
          <F label="Due" id="due"><input id="due" type="date" className="input" value={inv.due} onChange={(e) => set("due", e.target.value)} /></F>
          <F label="Currency" id="cur">
            <select id="cur" className="input" value={inv.currency} onChange={(e) => set("currency", e.target.value)}>
              {CURRENCIES.map(([c, s]) => <option key={c} value={c}>{c} {s !== c ? `(${s})` : ""}</option>)}
            </select>
          </F>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="From (you)" id="from"><textarea id="from" className="input min-h-28" value={inv.from} onChange={(e) => set("from", e.target.value)} /></F>
          <F label="Bill to (client)" id="to"><textarea id="to" className="input min-h-28" value={inv.to} onChange={(e) => set("to", e.target.value)} /></F>
        </div>

        <div>
          <p className="field-label">Items</p>
          <div className="space-y-2">
            {inv.items.map((it) => (
              <div key={it.id} className="grid grid-cols-[1fr_64px_96px_40px] gap-2 sm:grid-cols-[1fr_72px_110px_40px]">
                <input aria-label="Description" className="input" placeholder="Description" value={it.desc} onChange={(e) => setItem(it.id, { desc: e.target.value })} />
                <input aria-label="Quantity" className="input !px-2 text-center" type="number" min={0} value={it.qty} onChange={(e) => setItem(it.id, { qty: +e.target.value })} />
                <input aria-label="Rate" className="input !px-2" type="number" min={0} step="0.01" value={it.rate} onChange={(e) => setItem(it.id, { rate: +e.target.value })} />
                <IconBtn label={`Remove ${it.desc || "item"}`} onClick={() => setInv((p) => ({ ...p, items: p.items.filter((x) => x.id !== it.id) }))}><Trash2 size={16} /></IconBtn>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setInv((p) => ({ ...p, items: [...p.items, { id: uid(), desc: "", qty: 1, rate: 0 }] }))}><Plus size={15} /> Add item</button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <F label="Tax %" id="tax"><input id="tax" type="number" min={0} step="0.1" className="input" value={inv.taxPct} onChange={(e) => set("taxPct", +e.target.value)} /></F>
          <F label="Discount" id="disc"><input id="disc" type="number" min={0} className="input" value={inv.discount} onChange={(e) => set("discount", +e.target.value)} /></F>
          <F label="Colour" id="acc"><input id="acc" type="color" className="h-11 w-full cursor-pointer rounded-xl border border-line-hi bg-transparent p-1" value={inv.accent} onChange={(e) => set("accent", e.target.value)} /></F>
          <F label="Logo" id="logo">
            {inv.logo ? (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-line-hi px-2">
                <img src={inv.logo} alt="Your logo" className="h-8 max-w-[60px] object-contain" />
                <IconBtn label="Remove logo" onClick={() => set("logo", "")}><X size={15} /></IconBtn>
              </div>
            ) : (
              <label className="btn btn-ghost w-full"><ImagePlus size={16} /> Add
                <input id="logo" type="file" accept="image/png,image/jpeg" hidden onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 400_000) { toast.error("Use a logo under 400 KB."); return; }
                  const r = new FileReader();
                  r.onload = () => set("logo", String(r.result));
                  r.readAsDataURL(f);
                }} />
              </label>
            )}
          </F>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Payment details" id="pay"><textarea id="pay" className="input min-h-24" value={inv.payment} onChange={(e) => set("payment", e.target.value)} /></F>
          <F label="Notes" id="notes"><textarea id="notes" className="input min-h-24" value={inv.notes} onChange={(e) => set("notes", e.target.value)} /></F>
        </div>
      </div>

      {/* Live preview, same layout as the PDF */}
      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-xl bg-white text-[12px] text-[#1a1f26] shadow-2xl shadow-black/40">
          <div className="h-2" style={{ background: inv.accent }} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              {inv.logo ? <img src={inv.logo} alt="" className="max-h-12 max-w-[120px] object-contain" /> : <span />}
              <div className="text-right">
                <p className="text-[22px] font-extrabold" style={{ color: inv.accent }}>INVOICE</p>
                <p className="text-[#6b7380]"># {inv.number}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
              {[["From", inv.from], ["Bill to", inv.to], ["Dates", `Issued: ${fmtDate(inv.issued)}\nDue: ${fmtDate(inv.due)}`]].map(([h, b]) => (
                <div key={h}><p className="text-[9px] font-bold uppercase text-[#6b7380]">{h}</p><p className="whitespace-pre-line break-words">{b}</p></div>
              ))}
            </div>
            <table className="mt-4 w-full text-[11px]">
              <thead><tr style={{ background: `${inv.accent}1a` }}><th className="p-1.5 text-left">Description</th><th className="p-1.5">Qty</th><th className="p-1.5 text-right">Amount</th></tr></thead>
              <tbody>{inv.items.map((i) => <tr key={i.id} className="border-b border-[#e3e6ea]"><td className="p-1.5 break-words">{i.desc}</td><td className="p-1.5 text-center">{i.qty}</td><td className="p-1.5 text-right">{money(i.qty * i.rate, inv.currency)}</td></tr>)}</tbody>
            </table>
            <div className="ml-auto mt-3 w-1/2 space-y-1 text-[11px]">
              <p className="flex justify-between"><span className="text-[#6b7380]">Subtotal</span>{money(t.sub, inv.currency)}</p>
              {t.disc > 0 && <p className="flex justify-between"><span className="text-[#6b7380]">Discount</span>-{money(t.disc, inv.currency)}</p>}
              {inv.taxPct > 0 && <p className="flex justify-between"><span className="text-[#6b7380]">Tax ({inv.taxPct}%)</span>{money(t.tax, inv.currency)}</p>}
              <p className="flex justify-between rounded px-2 py-1.5 font-bold text-white" style={{ background: inv.accent }}><span>Total due</span>{money(t.total, inv.currency)}</p>
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-lg w-full" disabled={busy} onClick={download}>
          {busy ? <Spinner /> : <Download size={20} />} Download PDF invoice
        </button>
        <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => { if (confirm("Clear this invoice and start again?")) setInv({ ...BLANK, from: inv.from, payment: inv.payment, logo: inv.logo, accent: inv.accent, currency: inv.currency }); }}>
          <RotateCcw size={15} /> New invoice (keeps your details)
        </button>
      </aside>
    </div>
  );
}

function F({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div><label className="field-label" htmlFor={id}>{label}</label>{children}</div>;
}
