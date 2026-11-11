/**
 * Flat cow mark used for the Livestock navigation item.
 * Drawn on the same 24x24 grid and 1.75 stroke weight as the lucide set so it
 * sits consistently beside the other navigation icons. No gradients, no fills.
 */
export function CowIcon({ size = 20, className = '', strokeWidth = 1.75 }: {
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* horns */}
      <path d="M6.5 7.5c-1.6-.4-2.6-1.5-2.8-3" />
      <path d="M17.5 7.5c1.6-.4 2.6-1.5 2.8-3" />
      {/* head */}
      <path d="M8 6.2h8a2.4 2.4 0 0 1 2.4 2.4v3.9a6.4 6.4 0 0 1-12.8 0V8.6A2.4 2.4 0 0 1 8 6.2Z" />
      {/* ears */}
      <path d="M5.6 8.4 3.8 7.6" />
      <path d="M18.4 8.4l1.8-.8" />
      {/* eyes */}
      <path d="M9.6 10.6h.01" />
      <path d="M14.4 10.6h.01" />
      {/* muzzle */}
      <path d="M9.9 14.6a2.1 2.1 0 0 0 4.2 0" />
      <path d="M12 13.4v1.2" />
    </svg>
  );
}
