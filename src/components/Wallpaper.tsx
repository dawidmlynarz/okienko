import type { Wallpaper as W } from '../store/useDomek'

/** The desktop themes she can pick, with the swatch shown in the picker. */
export const DESKS: { id: W; name: string; swatch: [string, string] }[] = [
  { id: 'day', name: 'Niebo', swatch: ['var(--color-sky-200)', 'var(--color-lavender-100)'] },
  { id: 'meadow', name: 'Łąka', swatch: ['var(--color-mint-200)', 'var(--color-butter-100)'] },
  { id: 'lavender', name: 'Lawenda', swatch: ['var(--color-lavender-200)', 'var(--color-pink-100)'] },
  { id: 'candy', name: 'Cukierek', swatch: ['var(--color-pink-200)', 'var(--color-peach-100)'] },
  { id: 'lemon', name: 'Słoneczko', swatch: ['var(--color-butter-200)', 'var(--color-mint-100)'] },
  { id: 'sunset', name: 'Zachód słońca', swatch: ['var(--color-lavender-200)', 'var(--color-peach-200)'] },
]

const BLOBS: Record<W, [string, string, string]> = {
  day: ['var(--color-sky-200)', 'var(--color-lavender-200)', 'var(--color-mint-200)'],
  sunset: ['var(--color-pink-200)', 'var(--color-lavender-200)', 'var(--color-peach-200)'],
  meadow: ['var(--color-mint-200)', 'var(--color-butter-200)', 'var(--color-sky-200)'],
  lavender: ['var(--color-lavender-200)', 'var(--color-pink-200)', 'var(--color-sky-200)'],
  candy: ['var(--color-pink-200)', 'var(--color-lavender-200)', 'var(--color-peach-200)'],
  lemon: ['var(--color-butter-200)', 'var(--color-peach-200)', 'var(--color-mint-200)'],
}

/** The desktop: layered gradients with a few large, slowly drifting colour fields, in the theme she picked. */
export function Wallpaper({ kind = 'day' }: { kind?: W }) {
  const k = BLOBS[kind] ? kind : 'day'
  const blobs = BLOBS[k]
  return (
    <div className={`absolute inset-0 overflow-hidden transition-colors duration-700 sky-${k}`} aria-hidden>
      <div className="float-slow absolute -top-40 -left-32 size-[640px] rounded-full opacity-60 blur-3xl transition-colors duration-700" style={{ background: blobs[0] }} />
      <div className="float-slow absolute top-1/4 -right-40 size-[560px] rounded-full opacity-50 blur-3xl transition-colors duration-700" style={{ background: blobs[1], animationDelay: '-4s' }} />
      <div className="float-slow absolute -bottom-56 left-1/3 size-[720px] rounded-full opacity-50 blur-3xl transition-colors duration-700" style={{ background: blobs[2], animationDelay: '-7s' }} />
    </div>
  )
}
