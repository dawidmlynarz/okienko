import { Question, X } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

/**
 * A small (?) for grown-ups. The child sees only the icon; the explanation opens on click.
 * Closes on outside click or Escape.
 */
export function ParentHint({ text, align = 'right', className = '' }: { text: string; align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', off)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', off)
      window.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <span ref={box} className={`inline-flex ${/\babsolute\b/.test(className) ? '' : 'relative'} ${className}`}>
      <button
        type="button"
        aria-label="Wskazówka dla rodzica"
        title="Dla rodzica"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-full bg-white/80 text-ink-600 shadow-[0_0_0_1px_rgb(27_34_64/0.08)] transition-colors hover:bg-white hover:text-ink-900"
      >
        <Question size={20} weight="bold" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-11 z-50 flex w-80 flex-col gap-1.5 rounded-[18px] bg-surface p-4 text-left shadow-float ring-1 ring-ink-900/5 ${align === 'right' ? 'right-0' : 'left-0'}`}
            role="dialog"
            aria-label="Dla rodzica"
          >
            <span className="flex items-center justify-between">
              <span className="font-display text-sm font-bold tracking-wide text-ink-600 uppercase">Dla rodzica</span>
              <button type="button" aria-label="Zamknij" onClick={() => setOpen(false)} className="grid size-7 place-items-center rounded-full text-ink-600 hover:bg-ink-50">
                <X size={16} weight="bold" />
              </button>
            </span>
            <span className="font-body text-base leading-snug text-ink-800">{text}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
