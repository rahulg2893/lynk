/**
 * The Lynk mark: two interlocking rings, one blue and one silver, linked like
 * a chain (the blue ring passes over the silver one at the top crossing and
 * under it at the bottom). Colours come from --logo-* tokens so the silver
 * ring turns graphite on light backgrounds and stays visible.
 */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 46 34" className={className} aria-hidden>
      <defs>
        <linearGradient id="lynk-ring-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--logo-a-1)" />
          <stop offset="1" stopColor="var(--logo-a-2)" />
        </linearGradient>
        <linearGradient id="lynk-ring-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--logo-b-1)" />
          <stop offset="1" stopColor="var(--logo-b-2)" />
        </linearGradient>
        {/* The upper crossing, where the blue ring is on top. */}
        <clipPath id="lynk-over">
          <rect x="19" y="0" width="15" height="16" />
        </clipPath>
      </defs>
      <circle cx="16" cy="15" r="10" fill="none" stroke="url(#lynk-ring-a)" strokeWidth="5" />
      <circle cx="29" cy="19" r="10" fill="none" stroke="url(#lynk-ring-b)" strokeWidth="5" />
      <circle cx="16" cy="15" r="10" fill="none" stroke="url(#lynk-ring-a)" strokeWidth="5" clipPath="url(#lynk-over)" />
    </svg>
  );
}

export function Logo({
  className = "",
  withWord = true,
}: {
  className?: string;
  withWord?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-7 w-auto" />
      {withWord ? (
        <span className="text-xl font-medium tracking-tight">Lynk</span>
      ) : (
        <span className="sr-only">Lynk</span>
      )}
    </span>
  );
}
