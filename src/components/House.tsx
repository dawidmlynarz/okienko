import { motion } from 'motion/react'
import { useId } from 'react'

/**
 * Smoczek's house, with the new room on the right going up as `progress` runs from 0 to 1:
 * brick rows first, then the roof, then the sunset window. Flat shapes, no outlines, soft shade.
 */
export function House({ progress, width = 320, smoke = true }: { progress: number; width?: number | string; smoke?: boolean }) {
  const id = useId().replace(/:/g, '')
  const ROWS = 6
  const steps = ROWS + 2
  const shown = Math.floor(Math.min(1, Math.max(0, progress)) * steps + 1e-6)
  const roof = shown > ROWS
  const win = shown > ROWS + 1
  // New room wall: x 176..276, y 122..200
  const rowH = 78 / ROWS
  return (
    <svg viewBox="0 0 320 224" width={width} style={{ height: 'auto' }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-lavender-300)" />
          <stop offset=".55" stopColor="var(--color-pink-200)" />
          <stop offset="1" stopColor="var(--color-peach-300)" />
        </linearGradient>
        <clipPath id={`${id}-wall`}>
          <rect x="176" y="122" width="100" height="78" rx="6" />
        </clipPath>
      </defs>

      {/* ground */}
      <ellipse cx="160" cy="206" rx="150" ry="12" fill="var(--color-mint-200)" />
      <circle cx="28" cy="192" r="16" fill="var(--color-mint-400)" />
      <circle cx="44" cy="198" r="11" fill="var(--color-mint-300)" />
      <circle cx="296" cy="194" r="14" fill="var(--color-mint-400)" />

      {/* chimney + smoke */}
      <rect x="128" y="44" width="16" height="34" rx="3" fill="var(--color-coral-500)" />
      <rect x="125" y="40" width="22" height="8" rx="3" fill="var(--color-coral-600)" />
      {smoke &&
        [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx="137"
            cy="30"
            r={5 + i * 2}
            fill="#fff"
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ opacity: [0, 0.9, 0], y: [-2, -26], x: [0, 8] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.85, ease: 'easeOut' }}
          />
        ))}

      {/* main house */}
      <rect x="44" y="104" width="128" height="96" rx="8" fill="#FFF8EE" />
      <rect x="44" y="104" width="128" height="10" fill="var(--color-peach-200)" opacity=".7" />
      <path d="M30 112 L108 46 L186 112 Z" fill="var(--color-coral-400)" stroke="var(--color-coral-400)" strokeWidth="10" strokeLinejoin="round" />
      <path d="M26 114 L108 44 L190 114" fill="none" stroke="var(--color-coral-500)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="108" cy="84" r="11" fill="var(--color-butter-200)" stroke="#fff" strokeWidth="4" />
      {/* window */}
      <rect x="60" y="128" width="40" height="34" rx="7" fill="var(--color-sky-200)" stroke="#fff" strokeWidth="4" />
      <path d="M80 130v30M62 145h36" stroke="#fff" strokeWidth="3" />
      <rect x="56" y="162" width="48" height="6" rx="3" fill="var(--color-peach-300)" />
      {/* door */}
      <path d="M116 200v-46a15 15 0 0 1 30 0v46z" fill="var(--color-sky-600)" />
      <circle cx="139" cy="178" r="2.6" fill="var(--color-butter-300)" />
      <rect x="110" y="198" width="42" height="6" rx="3" fill="var(--color-ink-200)" />

      {/* new room: footprint, bricks, roof, window */}
      <rect x="176" y="122" width="100" height="78" rx="6" fill="rgb(255 255 255 / 0.5)" stroke="var(--color-ink-300)" strokeWidth="2.5" strokeDasharray="7 6" />
      <g clipPath={`url(#${id}-wall)`}>
        {Array.from({ length: ROWS }, (_, r) => {
          const y = 200 - (r + 1) * rowH
          const off = r % 2 ? -12 : 0
          return (
            <motion.g key={r} initial={false} animate={{ opacity: r < shown ? 1 : 0, y: r < shown ? 0 : -24 }} transition={{ type: 'spring', stiffness: 420, damping: 24 }}>
              {Array.from({ length: 5 }, (_, b) => (
                <rect key={b} x={176 + off + b * 25} y={y + 0.8} width="23.4" height={rowH - 1.6} rx="2" fill={(r + b) % 3 === 0 ? 'var(--color-peach-400)' : 'var(--color-peach-300)'} />
              ))}
            </motion.g>
          )
        })}
      </g>
      <motion.g initial={false} animate={{ opacity: roof ? 1 : 0, y: roof ? 0 : -30 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
        <path d="M172 126 L226 84 L280 126 Z" fill="var(--color-coral-400)" stroke="var(--color-coral-400)" strokeWidth="8" strokeLinejoin="round" />
        <path d="M168 128 L226 82 L284 128" fill="none" stroke="var(--color-coral-500)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
      <motion.g initial={false} animate={{ opacity: win ? 1 : 0, scale: win ? 1 : 0.4 }} style={{ transformOrigin: '226px 158px', transformBox: 'view-box' }} transition={{ type: 'spring', stiffness: 380, damping: 16 }}>
        <rect x="202" y="140" width="48" height="38" rx="9" fill={`url(#${id}-sun)`} stroke="#fff" strokeWidth="4" />
        <circle cx="226" cy="170" r="8" fill="var(--color-butter-200)" />
      </motion.g>
    </svg>
  )
}
