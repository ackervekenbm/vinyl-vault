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
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx="256" cy="256" r={186 - i * 11} />
        ))}
      </g>
      {/* label */}
      <circle cx="256" cy="256" r="76" className="rp-label" />
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
  const height = Math.round((size * 298) / 368)
  return (
    <svg
      width={size}
      height={height}
      viewBox="44 112 368 298"
      fill="none"
      aria-hidden="true"
    >
      {/* deck (top view) */}
      <rect
        x="46"
        y="114"
        width="364"
        height="294"
        rx="34"
        fill="#1d1d2a"
        stroke="#2e2e3e"
        strokeWidth="2"
      />
      {/* platter recess, left of center */}
      <circle cx="192" cy="262" r="140" fill="#15151e" />
      {/* spinning record */}
      <g transform="translate(192 262) scale(0.674)">
        <g className="rr-vinyl">
          <g transform="translate(-256 -256)">
            <RecordGraphic />
          </g>
        </g>
      </g>
      {/* tonearm (right, dropping down onto the record) */}
      <circle cx="376" cy="136" r="15" fill="#262636" stroke="#3b3b4c" strokeWidth="2" />
      <path
        d="M372 146 C 356 186 330 210 302 230"
        stroke="#3b3b4c"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path d="M302 230 L276 244" stroke="#1b1b26" strokeWidth="12" strokeLinecap="round" />
      <circle cx="272" cy="246" r="3" fill="#101018" />
      {/* controls + LEDs (left-to-right along the bottom) */}
      <circle cx="324" cy="382" r="11" fill="none" stroke="#3a3a4c" strokeWidth="2.5" />
      <circle cx="324" cy="382" r="5" className="rp-led rp-power-led" />
      <circle cx="360" cy="382" r="8" fill="none" stroke="#3a3a4c" strokeWidth="2" />
      <circle cx="360" cy="382" r="3" fill="#262636" />
      <circle cx="396" cy="382" r="4.5" fill="#3f6f4f" className="rp-led" />
    </svg>
  )
}