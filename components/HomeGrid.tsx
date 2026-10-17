"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import ToolCard from "./ToolCard";
import ToolIcon from "./ToolIcon";
import { categories, tools, type CategoryId } from "@/lib/tools";

export default function HomeGrid() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">("all");

  const query = q.trim().toLowerCase();
  const matches = useMemo(
    () =>
      tools.filter(
        (t) =>
          (cat === "all" || t.category === cat) &&
          (!query || `${t.name} ${t.short} ${t.keywords.join(" ")}`.toLowerCase().includes(query)),
      ),
    [cat, query],
  );

  const grouped = !query && cat === "all";

  return (
    <section className="wrap mt-8" aria-label="All tools">
      <div className="z-30 -mx-4 bg-bg/90 px-4 py-3 backdrop-blur-md md:sticky md:top-[68px]">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">Search tools</span>
            <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-3" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${tools.length} tools — try “merge”, “compress”, “password”`}
              className="input !min-h-[52px] !rounded-2xl !pl-12 !text-[16px]"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-fg-3 hover:text-fg">
                <X size={18} />
              </button>
            )}
          </label>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Filter by category">
            <Chip active={cat === "all"} onClick={() => setCat("all")}>All tools</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} color={c.color}>
                <ToolIcon name={c.icon} size={15} /> {c.name}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {grouped ? (
        categories.map((c) => (
          <div key={c.id} className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="flex items-center gap-2.5 text-[22px] font-bold">
                <span className="h-2.5 w-2.5 rotate-45 border-2" style={{ borderColor: c.color }} aria-hidden="true" />
                {c.title}
              </h2>
              <Link href={`/${c.id}-tools`} className="text-[14px] font-semibold text-cyan hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {tools.filter((t) => t.category === c.id).map((t) => <ToolCard key={t.slug} tool={t} />)}
            </div>
          </div>
        ))
      ) : matches.length ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {matches.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      ) : (
        <p className="mt-12 text-center text-fg-2">No tool matches “{q}”. Try a shorter word, like “pdf” or “image”.</p>
      )}
    </section>
  );
}

function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-10 flex-none cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[14px] font-semibold transition-colors ${
        active ? "border-cyan bg-cyan text-ink" : "border-line bg-bg/60 text-fg-2 hover:border-line-hi hover:text-fg"
      }`}
      style={!active && color ? { color } : undefined}
    >
      {children}
    </button>
  );
}
