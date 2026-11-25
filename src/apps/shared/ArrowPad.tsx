import { ArrowFatDown, ArrowFatLeft, ArrowFatRight, ArrowFatUp } from '@phosphor-icons/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { pl } from '../../i18n/pl'

export type Dir = 'up' | 'down' | 'left' | 'right'

export const ARROW: Record<Dir, (p: { size: number; weight?: 'fill' | 'bold' }) => ReactNode> = {
  up: (p) => <ArrowFatUp {...p} />,
  down: (p) => <ArrowFatDown {...p} />,
  left: (p) => <ArrowFatLeft {...p} />,
  right: (p) => <ArrowFatRight {...p} />,
}

const KEY_DIR: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }

/**
 * Arrow keys are named keys, so they need their own listener.
 * `repeatMs` lets a held key keep moving, no faster than that; leave it out to ignore held keys.
 */
export function useArrowKeys(onArrow: (d: Dir) => void, repeatMs?: number) {
  const ref = useRef(onArrow)
  ref.current = onArrow
  useEffect(() => {
    let last = 0
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIR[e.key]
      if (!dir) return
      e.preventDefault()
      if (e.repeat && (!repeatMs || e.timeStamp - last < repeatMs)) return
      last = e.timeStamp
      ref.current(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [repeatMs])
}

/** Four big arrow keys in the same layout as on the keyboard. */
export function ArrowPad({ onArrow, disabled }: { onArrow: (d: Dir) => void; disabled: boolean }) {
  const key = (d: Dir) => (
    <button
      type="button"
      aria-label={pl.konik.dirs[d]}
      onClick={() => onArrow(d)}
      disabled={disabled}
      className="pressable grid size-[min(64px,8vh)] place-items-center rounded-[16px] bg-surface text-accent-strong shadow-[inset_0_0_0_1.5px_var(--color-ink-200),0_3px_0_var(--color-ink-200)] hover:bg-accent-soft disabled:opacity-60"
    >
      {ARROW[d]({ size: 30, weight: 'fill' })}
    </button>
  )
  return (
    <div className="glass-strong flex flex-col items-center gap-2 rounded-[24px] p-3">
      {key('up')}
      <div className="flex gap-2">
        {key('left')}
        {key('down')}
        {key('right')}
      </div>
    </div>
  )
}
