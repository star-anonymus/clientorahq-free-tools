import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Check, WifiOff, Infinity as InfinityIcon, UserX } from "lucide-react";
import ToolLoader from "@/components/ToolLoader";
import ToolCard from "@/components/ToolCard";
import ToolIcon from "@/components/ToolIcon";
import ClientoraCta from "@/components/ClientoraCta";
import OneCta from "@/components/OneCta";
import JsonLd from "@/components/JsonLd";
import { categories, getCategory, getTool, tools, toolsIn, type Category, type ToolMeta } from "@/lib/tools";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...tools.map((t) => ({ slug: t.slug })), ...categories.map((c) => ({ slug: `${c.id}-tools` }))];
}

function categoryFromSlug(slug: string) {
  return categories.find((c) => `${c.id}-tools` === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = categoryFromSlug(slug);
  if (cat) {
    const title = `${cat.title} — Online, No Upload`;
    return {
      title,
      description: `${cat.blurb} Free, no sign-up, and your files never leave your device.`,
      alternates: { canonical: `/${slug}` },
      openGraph: { title, url: `/${slug}` },
    };
  }
  const tool = getTool(slug);
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: `/${tool.slug}` },
    openGraph: { title: tool.title, description: tool.description, url: `/${tool.slug}` },
    twitter: { title: tool.title, description: tool.description },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = categoryFromSlug(slug);
  if (cat) return <CategoryPage cat={cat} />;
  const tool = getTool(slug);
  if (!tool) notFound();
  return <ToolPage tool={tool} />;
}

function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-[13.5px] text-fg-3">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
            {it.href ? <Link href={it.href} className="hover:text-cyan">{it.name}</Link> : <span aria-current="page" className="text-fg-2">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ToolPage({ tool }: { tool: ToolMeta }) {
  const cat = getCategory(tool.category);
  const related = toolsIn(tool.category).filter((t) => t.slug !== tool.slug).slice(0, 4);
  const url = `${SITE.url}/${tool.slug}`;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: `${tool.name} — ClientoraHQ Free Tools`,
            url,
            description: tool.description,
            applicationCategory: tool.category === "business" ? "BusinessApplication" : "UtilitiesApplication",
            operatingSystem: "Any (runs in the browser)",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@type": "Organization", name: "ClientoraHQ", url: SITE.main },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: tool.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: `How to use ${tool.name}`,
            step: tool.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Free tools", item: SITE.url },
              { "@type": "ListItem", position: 2, name: cat.title, item: `${SITE.url}/${cat.id}-tools` },
              { "@type": "ListItem", position: 3, name: tool.name, item: url },
            ],
          },
        ]}
      />

      <section className="wrap pt-8 sm:pt-10">
        <Crumbs items={[{ name: "Free tools", href: "/" }, { name: `${cat.name} tools`, href: `/${cat.id}-tools` }, { name: tool.name }]} />
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border" style={{ color: cat.color, borderColor: `${cat.color}40`, background: `${cat.color}14` }}>
            <ToolIcon name={tool.icon} size={28} strokeWidth={1.8} />
          </span>
          <h1 className="text-[clamp(30px,5vw,46px)] font-extrabold">{tool.name}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[17px] text-fg-2">{tool.description.split(". ")[0]}.</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-3.5 py-1.5 text-[13.5px] font-semibold text-ok">
            <ShieldCheck size={16} aria-hidden="true" /> Your files never leave your device
          </p>
        </div>
      </section>

      <section className="wrap mt-8" aria-label={tool.name}>
        <div className="panel mx-auto max-w-5xl p-4 sm:p-6">
          <ToolLoader slug={tool.slug} />
        </div>
      </section>

      <section className="wrap mt-10">
        <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-3 text-[14px] text-fg-2 md:grid-cols-4">
          {[
            { icon: <ShieldCheck size={18} />, text: "Private: runs in your browser" },
            { icon: <InfinityIcon size={18} />, text: "Free, with no daily limits" },
            { icon: <UserX size={18} />, text: "No sign-up, no watermark" },
            { icon: <WifiOff size={18} />, text: "Works offline once loaded" },
          ].map((b) => (
            <li key={b.text} className="flex items-center gap-2.5 rounded-xl border border-line bg-bg/40 px-3 py-3">
              <span className="text-cyan" aria-hidden="true">{b.icon}</span>{b.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-[26px] font-bold">How to use {tool.name}</h2>
          <ol className="mt-5 space-y-4">
            {tool.steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-full border border-cyan/50 font-brand text-[14px] font-bold text-cyan">{i + 1}</span>
                <span className="pt-1.5 text-[16px] text-fg-2">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-[26px] font-bold">
            {tool.alternativeTo ? `A free ${tool.alternativeTo} alternative` : `Why use this ${tool.name.toLowerCase()}`}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {tool.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[15.5px] text-fg-2">
                <Check size={18} className="mt-0.5 flex-none text-ok" aria-hidden="true" /> {f}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[15px] leading-relaxed text-fg-3">
            Most online tools upload your file to their server, process it there and then make you pay to remove limits. This one does the work
            inside your browser tab instead — so it is faster, it is free for us to run, and your document stays with you.
          </p>
        </div>
      </section>

      <section className="wrap mt-16">
        <h2 className="text-[26px] font-bold">Questions about {tool.name}</h2>
        <div className="prose-faq mt-5 divide-y divide-line rounded-[18px] border border-line bg-panel">
          {tool.faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex items-center justify-between gap-4 text-[16.5px] font-semibold text-fg">
                {f.q}
                <ChevronRight size={18} className="flex-none text-cyan transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-[15.5px] leading-relaxed text-fg-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="wrap mt-16">
        <OneCta slug={tool.slug} />
      </section>

      <section className="wrap mt-6">
        <ClientoraCta />
      </section>

      {related.length > 0 && (
        <section className="wrap mt-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-[26px] font-bold">More {cat.name.toLowerCase()} tools</h2>
            <Link href={`/${cat.id}-tools`} className="text-[14.5px] font-semibold text-cyan hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </section>
      )}
    </>
  );
}

function CategoryPage({ cat }: { cat: Category }) {
  const list = toolsIn(cat.id);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: cat.title,
          itemListElement: list.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/${t.slug}`, name: t.name })),
        }}
      />
      <section className="wrap pt-8 sm:pt-10">
        <Crumbs items={[{ name: "Free tools", href: "/" }, { name: `${cat.name} tools` }]} />
        <p className="hud-label">{cat.name} tools</p>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)] font-extrabold">
          {cat.title.replace(/ tools$/, "")} <span style={{ color: cat.color }}>tools</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] text-fg-2">{cat.blurb} Free, no sign-up — and your files never leave your device.</p>
      </section>
      <section className="wrap mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {list.map((t) => <ToolCard key={t.slug} tool={t} />)}
      </section>
      <section className="wrap mt-16">
        <ClientoraCta />
      </section>
    </>
  );
}
