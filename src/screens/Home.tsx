import { ArrowUp, Star } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { Companion } from '../components/Companion'
import { Dock } from '../components/Dock'
import { timeText, useNow } from '../components/TopBar'
import { pl, stars } from '../i18n/pl'
import { UPGRADE_STARS, starsToday, useOkienko } from '../store/useOkienko'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, type: 'spring' as const, stiffness: 260, damping: 28 },
})

export function Home() {
  const { profile, progress, os, screen, setUpgradeOpen } = useOkienko()
  const now = useNow()
  const name = profile?.childName ?? ''
  const greeting = useMemo(() => (progress.rounds === 0 ? pl.home.greet(name) : pl.home.greetBack(name)), [name, progress.rounds])
  const canUpgrade = os.version === '1.0' && progress.stars >= UPGRADE_STARS

  // Offer the upgrade when she is back on the desktop, never in the middle of an app.
  useEffect(() => {
    if (canUpgrade && screen === 'home') {
      const t = window.setTimeout(() => setUpgradeOpen(true), 900)
      return () => window.clearTimeout(t)
    }
  }, [canUpgrade, screen, setUpgradeOpen])

  const have = Math.min(progress.stars, UPGRADE_STARS)
  const date = now.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center px-6 pt-8 pb-5">
      {/* Clock */}
      <motion.div {...rise(0)} className="flex flex-col items-center gap-2">
        <span className="font-display text-[112px] leading-none font-medium tracking-tight text-sky-900 tabular-nums">{timeText(now)}</span>
        <span className="glass rounded-full px-5 py-1.5 font-display text-lg font-medium text-ink first-letter:uppercase">{date}</span>
      </motion.div>

      {/* Widgets */}
      <div className="flex w-full max-w-5xl flex-1 items-center justify-center gap-5">
        <motion.section {...rise(0.08)} className="glass flex h-[260px] flex-1 items-center rounded-[28px] py-4 pr-8 pl-4">
          <Companion text={canUpgrade ? `${name}, mam niespodziankę!` : greeting} pose={canUpgrade ? 'cheer' : 'idle'} size={200} variant="plain" />
        </motion.section>

        <motion.section {...rise(0.14)} className="glass flex h-[260px] w-[340px] flex-col justify-between rounded-[28px] p-6">
          {os.version === '1.0' ? (
            <>
              <div>
                <p className="font-display text-base font-semibold text-muted">Następna wersja</p>
                <p className="font-display text-3xl font-bold text-ink">Okienko 1.1</p>
              </div>
              <div className="flex gap-1.5" aria-hidden>
                {Array.from({ length: UPGRADE_STARS }, (_, i) => (
                  <motion.span key={i} initial={false} animate={{ scale: i < have ? 1 : 0.9 }}>
                    <Star size={36} weight="fill" className={i < have ? 'text-butter-400 drop-shadow-[0_1px_0_var(--color-butter-600)]' : 'text-ink-200'} />
                  </motion.span>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-sky-600 transition-[width] duration-700" style={{ width: `${(have / UPGRADE_STARS) * 100}%` }} />
                </div>
                <p className="text-lg text-muted">{pl.os.starsToUpgrade(have, UPGRADE_STARS)}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="font-display text-base font-semibold text-muted">Dzisiaj</p>
                <p className="font-display text-3xl font-bold text-ink">{stars(starsToday(progress))}</p>
              </div>
              <div className="flex items-center gap-3 rounded-[18px] bg-mint-100 p-4 text-mint-900">
                <ArrowUp size={28} weight="bold" />
                <span className="font-display text-lg font-semibold">Masz Okienko {os.version}</span>
              </div>
              <p className="text-lg text-muted">Razem: {stars(progress.stars)}</p>
            </>
          )}
        </motion.section>
      </div>

      <Dock />
    </div>
  )
}
