export function BirdMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 64" className={className} aria-hidden="true">
      <path
        d="M18 34c-7 1-12 5-15 10 6-1 9-1 13-4 1 5 2 8 0 12 4-5 7-9 8-14-2-1-4-3-6-4z"
        fill="var(--color-sky)"
      />
      <ellipse cx="34" cy="40" rx="18" ry="13" fill="var(--color-sky)" />
      <ellipse cx="36" cy="43" rx="10" ry="7" fill="var(--color-cream)" />
      <circle cx="50" cy="27" r="11" fill="var(--color-sky)" />
      <circle cx="53" cy="31" r="4" fill="var(--color-cream)" />
      <path d="M60 27l14 3.5-14 4.5z" fill="var(--color-gold)" />
      <g className="note-tilt">
        <rect
          x="68"
          y="11"
          width="11"
          height="8"
          rx="1"
          fill="var(--color-paper)"
          stroke="var(--color-ink)"
          strokeWidth="1"
        />
        <path d="M68 11l5.5 4 5.5-4" fill="none" stroke="var(--color-coral)" strokeWidth="1" />
      </g>
      <circle cx="53" cy="25" r="1.7" fill="var(--color-ink)" />
      <circle cx="53.6" cy="24.4" r="0.55" fill="var(--color-paper)" />
      <ellipse className="wing" cx="32" cy="38" rx="9" ry="5.5" fill="var(--color-ink)" opacity="0.45" />
      <path
        d="M28 52v6M34 52.5v6"
        stroke="var(--color-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BirdInFlight({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      <path
        className="flap"
        d="M18 28c10-14 22-16 30-8-8 1-16 6-22 14-4-1-6-3-8-6z"
        fill="var(--color-sky)"
      />
      <ellipse cx="48" cy="36" rx="16" ry="11" fill="var(--color-sky)" />
      <ellipse cx="50" cy="38" rx="8" ry="6" fill="var(--color-cream)" />
      <circle cx="62" cy="28" r="9" fill="var(--color-sky)" />
      <path d="M69 27l10 3-10 4z" fill="var(--color-gold)" />
      <rect x="74" y="18" width="12" height="9" rx="1" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="1" />
      <path d="M74 18l6 4 6-4" fill="none" stroke="var(--color-coral)" strokeWidth="1" />
      <circle cx="64" cy="26" r="1.4" fill="var(--color-ink)" />
      <path
        className="flap"
        d="M30 40c8 10 18 12 26 4-8 0-16-4-20-10-3 2-5 4-6 6z"
        fill="var(--color-ink)"
        opacity="0.55"
      />
    </svg>
  );
}
