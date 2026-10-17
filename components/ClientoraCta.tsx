import { ArrowRight, Radar } from "lucide-react";
import { SITE } from "@/lib/site";

/** The one ask on every tool page: a quiet line about the paid product. */
export default function ClientoraCta() {
  return (
    <aside className="panel relative overflow-hidden p-6 sm:p-8" aria-label="About ClientoraHQ">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl border border-cyan/40 bg-cyan/10 text-cyan">
          <Radar size={28} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-[19px] font-bold leading-snug text-fg">Finding clients takes time? ClientoraHQ finds them for you.</p>
          <p className="mt-1 text-[15px] text-fg-2">
            AI that spots people asking for your service on LinkedIn and Instagram, local businesses without a website and fresh freelance projects — then writes the outreach. Try it for 14 days for $25.
          </p>
        </div>
        <a href={SITE.trialUrl} className="btn btn-primary flex-none">
          Start the $25 trial <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
