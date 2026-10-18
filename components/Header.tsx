"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";
import Logo from "./Logo";
import ToolIcon from "./ToolIcon";
import { categories, toolsIn } from "@/lib/tools";
import { SITE } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false); // mobile sheet
  const [mega, setMega] = useState(false); // desktop "All tools" menu

  useEffect(() => {
    if (!open && !mega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setMega(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mega]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="wrap flex h-[68px] items-center gap-4">
        <Logo />

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          <div className="relative" onMouseLeave={() => setMega(false)}>
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="mega"
              onClick={() => setMega((v) => !v)}
              onMouseEnter={() => setMega(true)}
              className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-[14.5px] text-fg-2 transition-colors hover:bg-cyan/5 hover:text-cyan"
            >
              All tools <ChevronDown size={16} className={`transition-transform ${mega ? "rotate-180" : ""}`} />
            </button>
            {mega && (
              <div id="mega" className="absolute left-0 top-full pt-2">
                <div className="panel grid w-[920px] grid-cols-5 gap-5 bg-bg-2/95 p-6 shadow-2xl shadow-black/60">
                  {categories.map((c) => (
                    <div key={c.id}>
                      <Link href={`/${c.id}-tools`} onClick={() => setMega(false)} className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: c.color }}>
                        <ToolIcon name={c.icon} size={15} /> {c.name}
                      </Link>
                      <ul className="space-y-0.5">
                        {toolsIn(c.id).map((t) => (
                          <li key={t.slug}>
                            <Link href={`/${t.slug}`} onClick={() => setMega(false)} className="block rounded-lg px-2 py-1.5 text-[14px] text-fg-2 transition-colors hover:bg-cyan/5 hover:text-fg">
                              {t.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {categories.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/${c.id}-tools`} className="rounded-[10px] px-3 py-2.5 text-[14.5px] text-fg-2 transition-colors hover:bg-cyan/5 hover:text-cyan">
              {c.name}
            </Link>
          ))}
          <a href={SITE.leadTools} className="flex items-center gap-1 rounded-[10px] px-3 py-2.5 text-[14.5px] text-fg-2 transition-colors hover:bg-cyan/5 hover:text-cyan">
            Lead tools <ArrowUpRight size={14} />
          </a>
        </nav>

        <a href={SITE.main} className="btn btn-primary btn-sm ml-auto hidden sm:inline-flex">
          Find clients with AI
        </a>
        <button
          type="button"
          className="btn btn-ghost btn-icon ml-auto sm:ml-0 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>

      {/* Outside the header on purpose: its backdrop-blur makes it the containing block for fixed children,
          which squeezed this full-screen sheet into the 68px header (the mobile menu never showed). */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-40 overflow-y-auto border-t border-line bg-bg lg:hidden">
          <nav aria-label="All tools" className="wrap py-6">
            {categories.map((c) => (
              <div key={c.id} className="mb-6">
                <Link href={`/${c.id}-tools`} onClick={() => setOpen(false)} className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: c.color }}>
                  <ToolIcon name={c.icon} size={15} /> {c.name} tools
                </Link>
                <ul className="grid grid-cols-2 gap-1">
                  {toolsIn(c.id).map((t) => (
                    <li key={t.slug}>
                      <Link href={`/${t.slug}`} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 text-[15px] text-fg-2 active:bg-cyan/10">
                        {t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex flex-col gap-3 border-t border-line pt-6">
              <a href={SITE.leadTools} className="btn btn-ghost">Free lead-gen tools <ArrowUpRight size={16} /></a>
              <a href={SITE.main} className="btn btn-primary">Find clients with AI</a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
