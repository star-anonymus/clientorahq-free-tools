import Link from "next/link";
import { categories, toolsIn } from "@/lib/tools";
import { SITE } from "@/lib/site";
import { Mark } from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line pb-10 pt-14 text-[14px] text-fg-3">
      <div className="wrap">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div className="max-w-xs">
            <div className="flex items-center gap-3">
              <Mark size={34} />
              <b className="font-brand text-[14px] font-black tracking-[0.14em] text-cyan">CLIENTORA HQ</b>
            </div>
            <p className="mt-4 leading-relaxed">
              Free tools that run in your browser. Your files never leave your device — no uploads, no accounts, no limits.
            </p>
            <a href={SITE.main} className="mt-4 inline-block font-semibold text-cyan hover:underline">
              ClientoraHQ finds clients for you →
            </a>
          </div>
          {categories.map((c) => (
            <div key={c.id}>
              <Link href={`/${c.id}-tools`} className="mb-3 block text-[12px] font-bold uppercase tracking-[0.14em] text-fg-2 hover:text-cyan">
                {c.name}
              </Link>
              <ul className="space-y-1.5">
                {toolsIn(c.id).map((t) => (
                  <li key={t.slug}>
                    <Link href={`/${t.slug}`} className="hover:text-cyan">{t.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[13px]">
          <p>© 2026 ClientoraHQ. Free to use.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-5">
            <a href={SITE.main} className="hover:text-cyan">clientorahq.com</a>
            <a href={SITE.leadTools} className="hover:text-cyan">Lead-gen tools</a>
            <a href="https://blog.clientorahq.com/" className="hover:text-cyan">Blog</a>
            <Link href="/privacy" className="hover:text-cyan">Privacy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
