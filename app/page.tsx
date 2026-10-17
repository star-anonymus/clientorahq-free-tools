import { ShieldCheck, Zap, Infinity as InfinityIcon, UserX } from "lucide-react";
import HomeGrid from "@/components/HomeGrid";
import ClientoraCta from "@/components/ClientoraCta";
import JsonLd from "@/components/JsonLd";
import { tools } from "@/lib/tools";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, publisher: { "@type": "Organization", name: "ClientoraHQ", url: SITE.main, logo: `${SITE.url}/icon.png` } },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Free online tools",
            itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/${t.slug}`, name: t.name })),
          },
        ]}
      />
      <section className="wrap pb-2 pt-10 text-center sm:pt-14">
        <p className="hud-label justify-center">ClientoraHQ Free Tools</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-[clamp(30px,5vw,52px)] font-extrabold">
          Every tool you need, <span className="cy">free</span> — and your files never leave your device
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[17.5px] text-fg-2">
          Merge and sign PDFs, compress images, remove backgrounds, make invoices and resumes, record your screen. No uploads, no sign-up,
          no daily limits — everything runs right here in your browser.
        </p>
        <ul className="mx-auto mt-7 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] text-fg-2">
          <li className="flex items-center gap-2"><ShieldCheck size={17} className="text-ok" aria-hidden="true" /> 100% private</li>
          <li className="flex items-center gap-2"><Zap size={17} className="text-cyan" aria-hidden="true" /> Instant — no upload wait</li>
          <li className="flex items-center gap-2"><InfinityIcon size={17} className="text-cyan" aria-hidden="true" /> No limits</li>
          <li className="flex items-center gap-2"><UserX size={17} className="text-cyan" aria-hidden="true" /> No account</li>
        </ul>
      </section>

      <HomeGrid />

      <section className="wrap mt-20 grid gap-6 md:grid-cols-3">
        {[
          { t: "Nothing is uploaded", d: "Big sites send your file to their servers. These tools open it inside your browser tab, do the work on your own laptop or phone, and hand the result straight back." },
          { t: "Free because it costs us nothing", d: "No servers process your files, so there is nothing to pay for and no reason to cap you at two files a day or stamp a watermark on the result." },
          { t: "Made by ClientoraHQ", d: "We build ClientoraHQ, an AI that finds clients for freelancers and agencies. These tools are our thank-you to the people who do the work." },
        ].map((b) => (
          <div key={b.t} className="panel p-6">
            <h2 className="text-[19px] font-bold">{b.t}</h2>
            <p className="mt-2 text-[15.5px] leading-relaxed text-fg-2">{b.d}</p>
          </div>
        ))}
      </section>

      <section className="wrap mt-16">
        <ClientoraCta />
      </section>
    </>
  );
}
