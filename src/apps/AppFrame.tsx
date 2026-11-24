import { House } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { Suspense, createContext, useCallback, useContext, useRef } from 'react'
import { AppIcon } from '../components/Dock'
import { pl } from '../i18n/pl'
import { play } from '../lib/sound'
import { stopSpeaking } from '../lib/speak'
import { useOkienko } from '../store/useOkienko'
import type { AppDef } from './registry'

/**
 * The one wrapper every app renders in. In Okienko 1.x it is full screen with a
 * big Home button; when windows unlock, the same frame becomes a movable window.
 */

type Guard = (proceed: () => void) => boolean
const GuardContext = createContext<(g: Guard | null) => void>(() => {})

/** An app calls this to intercept closing (e.g. "Save the note?"). Return true to block. */
export const useCloseGuard = () => useContext(GuardContext)

export function AppFrame({ app }: { app: AppDef }) {
  const goHome = useOkienko((s) => s.goHome)
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
  return (
    <motion.section
      data-app={app.accent}
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
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
          className="pressable flex h-12 items-center gap-2 rounded-full bg-accent-soft px-5 font-display text-lg font-semibold text-accent-deep hover:bg-accent-pastel"
        >
          <House size={24} weight="bold" /> {pl.os.home}
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
