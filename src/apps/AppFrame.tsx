import { X } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { Suspense, createContext, useCallback, useContext, useRef, useState } from 'react'
import { AppIcon, launchOrigin } from '../components/Dock'
import { pl } from '../i18n/pl'
import { play } from '../lib/sound'
import { stopSpeaking } from '../lib/speak'
import { useDomek } from '../store/useDomek'
import type { AppDef } from './registry'

/**
 * The one wrapper every app renders in. In the first version it is full screen with a
 * big Home button; when windows unlock, the same frame becomes a movable window.
 */

type Guard = (proceed: () => void) => boolean
const GuardContext = createContext<(g: Guard | null) => void>(() => {})

/** An app calls this to intercept closing (e.g. "Save the note?"). Return true to block. */
export const useCloseGuard = () => useContext(GuardContext)

export function AppFrame({ app }: { app: AppDef }) {
  const goHome = useDomek((s) => s.goHome)
  const guard = useRef<Guard | null>(null)
  const setGuard = useCallback((g: Guard | null) => {
    guard.current = g
  }, [])

  const close = useCallback(() => {
    const proceed = () => {
      stopSpeaking()
      play('whoosh')
      goHome()
    }
    if (guard.current?.(proceed)) return
    proceed()
  }, [goHome])

  const App = app.component
  // The frame sits at inset-4 (16px), so the origin is the icon centre relative to it.
  const [origin] = useState(() => (launchOrigin ? `${launchOrigin.x - 16}px ${launchOrigin.y - 16}px` : '50% 100%'))
  return (
    <motion.section
      data-app={app.accent}
      // Genie: the window pours out of its dock icon (and back into it on close).
      style={{ transformOrigin: origin }}
      initial={{ opacity: 0, scaleX: 0.06, scaleY: 0.04 }}
      animate={{ opacity: 1, scaleX: 1, scaleY: 1, transition: { scaleY: { duration: 0.42, ease: [0.2, 0.8, 0.25, 1] }, scaleX: { duration: 0.5, delay: 0.06, ease: [0.3, 0.9, 0.3, 1] }, opacity: { duration: 0.12 } } }}
      exit={{ opacity: 0, scaleX: 0.06, scaleY: 0.04, transition: { scaleX: { duration: 0.3, ease: [0.5, 0, 0.8, 0.4] }, scaleY: { duration: 0.38, delay: 0.05, ease: [0.5, 0, 0.8, 0.4] }, opacity: { duration: 0.2, delay: 0.2 } } }}
      className="absolute inset-4 z-20 flex flex-col overflow-hidden rounded-[28px] bg-surface shadow-float ring-1 ring-white/80"
      aria-label={app.name}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-ink-100 bg-surface px-4" style={{ height: 'var(--titlebar-height)' }}>
        <AppIcon icon={app.icon} size={44} />
        <h1 className="flex-1 font-display text-2xl font-bold text-ink">{app.name}</h1>
        <button
          type="button"
          onClick={() => {
            play('click')
            close()
          }}
          aria-label={pl.os.close}
          title={pl.os.close}
          className="pressable grid size-12 place-items-center rounded-full bg-accent-soft text-accent-deep hover:bg-coral-100 hover:text-coral-900"
        >
          <X size={26} weight="bold" />
        </button>
      </header>
      <div className="relative min-h-0 flex-1">
        <GuardContext.Provider value={setGuard}>
          <Suspense fallback={null}>
            <App close={close} />
          </Suspense>
        </GuardContext.Provider>
      </div>
    </motion.section>
  )
}
