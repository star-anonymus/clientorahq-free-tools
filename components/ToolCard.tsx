import Link from "next/link";
import ToolIcon from "./ToolIcon";
import { getCategory, type ToolMeta } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: ToolMeta }) {
  const color = getCategory(tool.category).color;
  return (
    <Link
      href={`/${tool.slug}`}
      className="group relative flex h-full flex-col gap-3 rounded-[16px] border border-line bg-panel p-4 sm:p-5 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line-hi hover:shadow-[0_16px_44px_rgb(0_0_0/.45)]"
    >
      <span
        className="grid h-12 w-12 place-items-center rounded-xl border"
        style={{ color, borderColor: `${color}40`, background: `${color}14` }}
      >
        <ToolIcon name={tool.icon} size={24} strokeWidth={1.8} />
      </span>
      <span className="flex items-center gap-2 text-[16px] font-bold leading-tight text-fg sm:text-[17px]">
        {tool.name}
        {tool.isNew && (
          <span className="rounded-full border border-cyan/50 px-2 py-px text-[10.5px] font-bold uppercase tracking-wider text-cyan">New</span>
        )}
      </span>
      <span className="text-[13.5px] leading-snug text-fg-2 sm:text-[14.5px]">{tool.short}</span>
    </Link>
  );
}
