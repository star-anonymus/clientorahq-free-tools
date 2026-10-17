import { ogCard, OG_SIZE } from "@/lib/og";
import { categories, getCategory, getTool, tools } from "@/lib/tools";

export const dynamic = "force-static";
export const dynamicParams = false;
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return [...tools.map((t) => ({ slug: t.slug })), ...categories.map((c) => ({ slug: `${c.id}-tools` }))];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = categories.find((c) => `${c.id}-tools` === slug);
  if (cat) return ogCard({ kicker: `${cat.name} tools`, title: cat.title, sub: cat.blurb, color: cat.color });
  const tool = getTool(slug)!;
  const c = getCategory(tool.category);
  return ogCard({
    kicker: tool.alternativeTo ? `Free ${tool.alternativeTo} alternative` : `${c.name} tool`,
    title: tool.name,
    sub: tool.short,
    color: c.color,
  });
}
