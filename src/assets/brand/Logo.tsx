export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Mau Crest Hub logo">
      <rect width="64" height="64" rx="12" fill="#1F4D2E" />
      <path d="M10 44 L26 26 L36 38 L44 30 L54 44 Z" fill="#B7892B" />
      <path d="M32 12 C32 12 26 19 26 24 a6 6 0 0 0 12 0 C38 19 32 12 32 12 Z" fill="#FFF8E1" />
    </svg>
  );
}

export function LogoWithText({
  dark = false,
  compact = false
}: { dark?: boolean; compact?: boolean }) {
  if (compact) {
    return <LogoMark size={36} />;
  }
  return (
    <div className="flex items-center gap-3 min-w-0">
      <LogoMark size={38} />
      <div className="min-w-0">
        <div className={`text-[17px] font-bold leading-tight truncate ${dark ? 'text-cream' : 'text-forest'}`}>
          Mau Crest Hub
        </div>
        <div className={`text-[13px] leading-snug ${dark ? 'text-cream/75' : 'text-ink-muted'}`}>
          Nurtured by Nature, Delivered Fresh
        </div>
      </div>
    </div>
  );
}
