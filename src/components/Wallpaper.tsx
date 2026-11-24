import type { Wallpaper as W } from '../store/useOkienko'

/** Soft sky: layered gradients with a few large, slowly drifting colour fields. */
export function Wallpaper({ kind = 'day' }: { kind?: W }) {
  const sunset = kind === 'sunset'
  const blobs = sunset
    ? ['var(--color-pink-200)', 'var(--color-lavender-300)', 'var(--color-peach-200)']
    : ['var(--color-sky-200)', 'var(--color-lavender-200)', 'var(--color-mint-200)']
  return (
    <div className={`absolute inset-0 overflow-hidden transition-colors duration-700 ${sunset ? 'sky-sunset' : 'sky-day'}`} aria-hidden>
      <div className="float-slow absolute -top-40 -left-32 size-[640px] rounded-full opacity-60 blur-3xl" style={{ background: blobs[0] }} />
      <div className="float-slow absolute top-1/4 -right-40 size-[560px] rounded-full opacity-50 blur-3xl" style={{ background: blobs[1], animationDelay: '-4s' }} />
      <div className="float-slow absolute -bottom-56 left-1/3 size-[720px] rounded-full opacity-50 blur-3xl" style={{ background: blobs[2], animationDelay: '-7s' }} />
    </div>
  )
}
