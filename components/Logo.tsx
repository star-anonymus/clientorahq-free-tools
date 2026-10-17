import Link from "next/link";

/** ClientoraHQ mark — the same dashed-ring "C" used on clientorahq.com. */
export function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="flex-none">
      <circle cx="20" cy="20" r="18.5" fill="#031421" stroke="#29e6ff" strokeWidth="1.5" strokeDasharray="5 2.5" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="#29e6ff" strokeWidth="1" opacity=".5" />
      <text x="20" y="27.5" textAnchor="middle" fontFamily="var(--font-orbitron), sans-serif" fontWeight="900" fontSize="21" fill="#7df3ff">C</text>
    </svg>
  );
}

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="ClientoraHQ Free Tools home">
      <Mark />
      <span className="leading-none">
        <b className="block font-brand text-[16px] font-black tracking-[0.14em] text-cyan [text-shadow:0_0_18px_rgb(41_230_255/.45)]">
          CLIENTORA
          <span className="ml-[0.28em] rounded-[4px] border border-current px-[5px] pt-px align-[2px] text-[0.72em] tracking-[0.1em]">HQ</span>
        </b>
        <small className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-fg-3">Free tools</small>
      </span>
    </Link>
  );
}
