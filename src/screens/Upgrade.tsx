import { BookOpenText, SunHorizon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Companion } from '../components/Companion'
import { pl } from '../i18n/pl'
import { celebrate } from '../lib/confetti'
import { play } from '../lib/sound'
import { useOkienko } from '../store/useOkienko'

type Phase = 'offer' | 'installing' | 'restart' | 'new'
const NEXT = '1.1'
const INSTALL_MS = 7000

export function UpgradeOverlay() {
  const { upgradeOpen, setUpgradeOpen, upgradeTo } = useOkienko()
  const [phase, setPhase] = useState<Phase>('offer')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (upgradeOpen) {
      setPhase('offer')
      setProgress(0)
      play('star')
    }
  }, [upgradeOpen])

  useEffect(() => {
    if (phase !== 'installing') return
    const start = performance.now()
    let raf = 0
    let lastTick = 0
    const step = (t: number) => {
      // Ease so it feels like real work: fast start, a little pause, steady finish.
      const x = Math.min(1, (t - start) / INSTALL_MS)
      const eased = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
      setProgress(eased)
      if (t - lastTick > 260) {
        play('tick')
        lastTick = t
      }
      if (x < 1) raf = requestAnimationFrame(step)
      else {
        setPhase('restart')
        play('whoosh')
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  useEffect(() => {
    if (phase !== 'restart') return
    const t = window.setTimeout(() => {
      upgradeTo(NEXT)
      setPhase('new')
      play('fanfare')
      celebrate()
    }, 2200)
    return () => window.clearTimeout(t)
  }, [phase, upgradeTo])

  const stepIdx = Math.min(pl.upgrade.steps.length - 1, Math.floor(progress * pl.upgrade.steps.length))

  return (
    <AnimatePresence>
      {upgradeOpen && (
        <motion.div
          className={`fixed inset-0 z-40 grid place-items-center p-6 ${phase === 'restart' ? 'bg-sky-900' : 'bg-sky-900/35 backdrop-blur-sm'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AnimatePresence mode="wait">
            {phase === 'restart' ? (
              <motion.div key="restart" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6 text-white">
                <svg viewBox="0 0 24 24" className="size-28" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.g
                      key={i}
                      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.18, type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <rect x={i % 2 ? 13 : 3} y={i < 2 ? 3 : 13} width="8" height="8" rx="2" fill={['#9EDAFE', '#91E7B9', '#FFBAD4', '#EECC85'][i]} />
                    </motion.g>
                  ))}
                </svg>
                <span className="font-display text-5xl font-semibold">{pl.os.version(NEXT)}</span>
                <span className="text-xl text-sky-100">{pl.upgrade.restarting}</span>
              </motion.div>
            ) : (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-xl bg-surface p-10 text-center shadow-float"
              >
                {phase === 'offer' && (
                  <>
                    <Companion pose="cheer" say={pl.upgrade.readySay(NEXT)} size={200} />
                    <h2 className="font-display text-4xl font-semibold">{pl.upgrade.ready}</h2>
                    <p className="text-2xl text-muted">{pl.os.version('1.0')} → <strong className="text-sky-700">{pl.os.version(NEXT)}</strong></p>
                    <div className="flex gap-4">
                      <Button variant="plain" size="lg" onClick={() => setUpgradeOpen(false)}>
                        {pl.upgrade.later}
                      </Button>
                      <Button variant="strong" size="lg" onClick={() => setPhase('installing')}>
                        {pl.upgrade.install}
                      </Button>
                    </div>
                  </>
                )}
                {phase === 'installing' && (
                  <>
                    <Companion pose="thinking" size={200} />
                    <h2 className="font-display text-4xl font-semibold">{pl.upgrade.installing(NEXT)}</h2>
                    <div className="h-8 w-full overflow-hidden rounded-full bg-sky-100" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full w-full origin-left rounded-full bg-sky-600" style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
                    </div>
                    <div className="flex w-full justify-between text-xl">
                      <AnimatePresence mode="wait">
                        <motion.span key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-muted">
                          {pl.upgrade.steps[stepIdx]}
                        </motion.span>
                      </AnimatePresence>
                      <span className="font-display font-semibold tabular-nums text-sky-800">{Math.round(progress * 100)}%</span>
                    </div>
                  </>
                )}
                {phase === 'new' && (
                  <>
                    <Companion pose="cheer" say={pl.upgrade.doneSay(NEXT)} size={180} />
                    <h2 className="font-display text-4xl font-semibold">{pl.upgrade.whatsNew(NEXT)}</h2>
                    <ul className="flex w-full flex-col gap-4 text-left">
                      {pl.upgrade.features.map((f, i) => (
                        <motion.li
                          key={f.title}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.25 }}
                          className="flex items-start gap-4 rounded-lg bg-sky-50 p-5"
                        >
                          <span className="grid size-14 shrink-0 place-items-center rounded-md bg-sky-200 text-sky-900">
                            {i === 0 ? <BookOpenText size={32} weight="bold" /> : <SunHorizon size={32} weight="bold" />}
                          </span>
                          <span>
                            <span className="block font-display text-2xl font-semibold">{f.title}</span>
                            <span className="text-xl text-muted">{f.body}</span>
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                    <Button variant="strong" size="lg" onClick={() => setUpgradeOpen(false)}>
                      {pl.upgrade.ok}
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
