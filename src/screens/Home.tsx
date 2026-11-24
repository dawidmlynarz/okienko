import { Star } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { Companion } from '../components/Companion'
import { Dock } from '../components/Dock'
import { pl } from '../i18n/pl'
import { UPGRADE_STARS, useOkienko } from '../store/useOkienko'

export function Home() {
  const { profile, progress, os, screen, setUpgradeOpen } = useOkienko()
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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between pb-6">
      <div className="flex flex-1 items-center justify-center">
        <Companion text={canUpgrade ? null : greeting} pose={canUpgrade ? 'cheer' : 'idle'} size={260} />
      </div>

      {os.version === '1.0' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-4 rounded-full bg-surface/90 px-6 py-3 shadow-card"
        >
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: UPGRADE_STARS }, (_, i) => (
              <Star key={i} size={30} weight={i < have ? 'fill' : 'bold'} className={i < have ? 'text-butter-600' : 'text-ink-600'} />
            ))}
          </div>
          <span className="text-lg text-muted">{pl.os.starsToUpgrade(have, UPGRADE_STARS)}</span>
        </motion.div>
      )}

      <Dock />
    </div>
  )
}
