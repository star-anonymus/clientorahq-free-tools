import { ArrowRight, MessageCircleReply, ReceiptText, Sparkles, Store } from "lucide-react";

// After someone uses a free tool, the one paid next step that fits what they just did: ClientoraHQ One
const ONE = "https://one.clientorahq.com";
type Pick = { icon: typeof Store; title: string; text: string; href: string; cta: string };

const BY_TOOL: Record<string, Pick> = {
  "invoice-generator": { icon: ReceiptText, title: "Send invoices like this on WhatsApp, and see who has paid", text: "ClientoraHQ One saves every client, sends invoices and receipts on WhatsApp in one tap, and reminds people who forget. AI fills an invoice from one line.", href: `${ONE}/tools/whatsapp-invoice-generator`, cta: "See WhatsApp invoices" },
};
const STORE: Pick = { icon: Store, title: "Selling on Instagram? Put your products behind one link", text: "A bio-link store with your products, prices and an Order on WhatsApp button. Ready in a minute, paid in rupees.", href: `${ONE}/tools/link-in-bio-store`, cta: "See the bio-link store" };
const CAPTIONS: Pick = { icon: Sparkles, title: "Let AI write your Instagram captions", text: "Three captions, 15 hashtags and a week of post ideas for your business, in English, Roman Urdu or a mix.", href: `${ONE}/tools/instagram-caption-generator`, cta: "See the caption maker" };
const DM: Pick = { icon: MessageCircleReply, title: "Answer every “price?” comment automatically", text: "When someone comments a keyword on your post, they get your message and link in their DMs.", href: `${ONE}/tools/instagram-auto-dm`, cta: "See comment-to-DM" };

const STORE_TOOLS = ["qr-code-generator", "background-remover", "compress-image", "image-converter", "color-palette-generator", "jpg-to-pdf", "pdf-to-jpg"];
const TEXT_TOOLS = ["word-counter", "case-converter", "text-cleaner", "remove-duplicate-lines", "lorem-ipsum-generator", "markdown-editor"];

function pick(slug: string): Pick {
  if (BY_TOOL[slug]) return BY_TOOL[slug];
  if (STORE_TOOLS.includes(slug)) return STORE;
  if (TEXT_TOOLS.includes(slug)) return CAPTIONS;
  return slug.length % 2 ? DM : STORE;
}

export default function OneCta({ slug }: { slug: string }) {
  const p = pick(slug);
  return (
    <aside className="panel relative overflow-hidden p-6 sm:p-8" aria-label="ClientoraHQ One">
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl border border-cyan/40 bg-cyan/10 text-cyan">
          <p.icon size={28} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-[19px] font-bold leading-snug text-fg">{p.title}</p>
          <p className="mt-1 text-[15px] text-fg-2">{p.text} Part of ClientoraHQ One: 4 daily tools from Rs 299 a month.</p>
        </div>
        <a href={p.href} className="btn btn-primary flex-none">
          {p.cta} <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
