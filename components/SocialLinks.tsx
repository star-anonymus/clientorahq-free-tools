import { SOCIAL } from "@/lib/social";

/** ClientoraHQ's social profiles as a row of icon links (footer). */
export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul aria-label="ClientoraHQ on social media" className={`flex flex-wrap gap-2.5 ${className}`}>
      {SOCIAL.map((s) => (
        <li key={s.name}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener"
            aria-label={`ClientoraHQ on ${s.name}`}
            title={`ClientoraHQ on ${s.name}`}
            className="grid size-10 place-items-center rounded-[10px] border border-line text-cyan transition-colors hover:border-cyan"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={s.d} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
