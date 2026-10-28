import { ArrowRight } from "lucide-react";

// Cross-promotion for the other ClientoraHQ products. Rendered once in the root
// layout, after <main> and before the footer, so it sits below every tool.
const CARDS = [
  {
    name: "ClientoraHQ One",
    text: "Your store in one link: products, prices, bookings, and orders on WhatsApp. Paid in rupees.",
    cta: "See ClientoraHQ One",
    href: "https://one.clientorahq.com/?utm_source=tools&utm_medium=crosspromo",
    img: "/ads/ad-one-wide.webp",
    alt: "ClientoraHQ One: a phone showing a bio-link store with products, prices, a booking button and Order on WhatsApp",
  },
  {
    name: "ClientoraHQ",
    text: "Find clients who are asking for your service on LinkedIn, Instagram and Google Maps. Free plan in your browser.",
    cta: "Start free",
    href: "https://platform.clientorahq.com/signup?utm_source=tools&utm_medium=crosspromo",
    img: "/ads/ad-plat-wide.webp",
    alt: "ClientoraHQ: new leads found on LinkedIn and Google Maps, each with a ready-to-send outreach message",
  },
];

export default function FamilyPromo() {
  return (
    <section className="wrap mt-20" aria-labelledby="family-promo-title">
      <p className="hud-label">From the ClientoraHQ family</p>
      <h2 id="family-promo-title" className="mt-3 text-[26px] font-bold">More from ClientoraHQ</h2>
      <div className="mt-5 grid gap-4 sm:gap-6 md:grid-cols-2">
        {CARDS.map((c) => (
          <article key={c.name} className="panel flex min-w-0 flex-col overflow-hidden">
            {/* Static export: images are unoptimized, so a plain sized <img> is what ships either way. */}
            <img src={c.img} alt={c.alt} width={720} height={378} loading="lazy" decoding="async" className="block h-auto w-full border-b border-line" />
            <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
              <div className="flex-1">
                <h3 className="text-[19px] font-bold leading-snug text-fg">{c.name}</h3>
                <p className="mt-1 text-[15px] text-fg-2">{c.text}</p>
              </div>
              <a href={c.href} className="btn btn-primary self-start">
                {c.cta} <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
