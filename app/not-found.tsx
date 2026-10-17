import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import { tools } from "@/lib/tools";

const POPULAR = ["merge-pdf", "compress-image", "sign-pdf", "background-remover"];

export default function NotFound() {
  return (
    <section className="wrap pt-16 text-center">
      <p className="hud-label justify-center">404</p>
      <h1 className="mt-3 text-[clamp(30px,5vw,46px)] font-extrabold">This page doesn&apos;t exist</h1>
      <p className="mx-auto mt-3 max-w-lg text-fg-2">The tool may have moved. Here are the most used ones — or browse them all.</p>
      <Link href="/" className="btn btn-primary mt-6">See all tools</Link>
      <div className="mt-12 grid grid-cols-2 gap-3 text-left sm:gap-4 lg:grid-cols-4">
        {tools.filter((t) => POPULAR.includes(t.slug)).map((t) => <ToolCard key={t.slug} tool={t} />)}
      </div>
    </section>
  );
}
