interface IconProps {
  size?: number
}

export function RefreshIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  )
}

export function SettingsIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

interface ChevronIconProps extends IconProps {
  direction: 'up' | 'down'
}

export function FilterIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export function ShuffleIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
      <path d="m18 14 4 4-4 4" />
    </svg>
  )
}

export function ChevronIcon({ size = 14, direction }: ChevronIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === 'down' ? <path d="m6 9 6 6 6-6" /> : <path d="m18 15-6-6-6 6" />}
    </svg>
  )
}

interface RecordGraphicProps {
  disc?: string
  rim?: string
}

function RecordGraphic({ disc = '#20202c', rim = '#3b3b4c' }: RecordGraphicProps) {
  return (
    <>
      <circle cx="256" cy="256" r="196" fill={disc} />
      <circle cx="256" cy="256" r="196" stroke={rim} strokeWidth="3" />
      {/* grooves */}
      <g stroke="#fff" fill="none" strokeWidth="1.5" opacity="0.05">
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx="256" cy="256" r={156 - i * 14} />
        ))}
      </g>
      {/* light reflection arc */}
      <path
        d="M108 198 A196 196 0 0 1 256 60"
        fill="none"
        stroke="#fff"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.06"
      />
      {/* label */}
      <circle cx="256" cy="256" r="76" fill="#d97a1e" />
      <circle cx="256" cy="256" r="54" fill="#b85c14" opacity="0.18" />
      <path
        d="M256 214 A42 42 0 0 1 256 298"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.25"
      />
      {/* spindle hole */}
      <circle cx="256" cy="256" r="13" fill="#101018" />
    </>
  )
}

export function VinylIcon({ size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
    >
      <RecordGraphic />
    </svg>
  )
}

export function RecordPlayer({ size = 150 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
    >
      {/* deck (top view) */}
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="40"
        fill="#1d1d2a"
        stroke="#2e2e3e"
        strokeWidth="2"
      />
      {/* platter recess */}
      <circle cx="244" cy="258" r="160" fill="#15151e" />
      {/* spinning record, off-center */}
      <g transform="translate(220 252) scale(0.755)">
        <g className="rr-vinyl">
          <RecordGraphic />
        </g>
      </g>
      {/* tonearm (top-right, reaching down to the record) */}
      <circle cx="426" cy="102" r="8" fill="#0d0d15" />
      <circle cx="396" cy="118" r="15" fill="#262636" stroke="#3b3b4c" strokeWidth="2" />
      <path
        d="M392 128 C 366 162 354 190 330 214"
        stroke="#3b3b4c"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path d="M330 214 L306 236" stroke="#1b1b26" strokeWidth="12" strokeLinecap="round" />
      <circle cx="300" cy="240" r="3" fill="#101018" />
      {/* power button + LED */}
      <circle cx="430" cy="452" r="11" fill="none" stroke="#3a3a4c" strokeWidth="2.5" />
      <circle cx="430" cy="452" r="4.5" fill="#d97a1e" />
    </svg>
  )
}