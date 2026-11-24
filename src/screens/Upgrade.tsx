import { BookOpenText, SunHorizon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Companion } from '../components/Companion'
import { House } from '../components/House'
import { ParentHint } from '../components/ParentHint'
import { pl } from '../i18n/pl'
import { celebrate } from '../lib/confetti'
import { play } from '../lib/sound'
import { useDomek } from '../store/useDomek'

/**
 * The 1.0 to 1.1 update, told as a story a six-year-old gets:
 * her stars pay for a new room in Smoczek's house, he builds it, opens the door, and shows what is inside.
 * A small line says grown-ups call this an "update", so the real word is learnt too.
 */
type Phase = 'offer' | 'installing' | 'restart' | 'new'
const NEXT = '1.1'
const BUILD_MS = 7000

export function UpgradeOverlay() {
  const { upgradeOpen, setUpgradeOpen, upgradeTo } = useDomek()
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
      const x = Math.min(1, (t - start) / BUILD_MS)
      const eased = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
      setProgress(eased)
      if (t - lastTick > 320) {
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
    }, 2600)
    return () => window.clearTimeout(t)
  }, [phase, upgradeTo])


  return (
    <AnimatePresence>
      {upgradeOpen && (
        <motion.div
          className={`fixed inset-0 z-40 grid place-items-center p-6 transition-colors duration-500 ${phase === 'restart' ? 'bg-ink-900' : 'bg-ink-900/40 backdrop-blur-md'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AnimatePresence mode="wait">
            {phase === 'restart' ? (
              <motion.div key="restart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 text-white">
                <Door />
              </motion.div>
            ) : (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="card relative flex max-h-full w-full max-w-4xl flex-col items-center gap-6 rounded-[40px] p-10 text-center"
              >
                <ParentHint text={pl.parentHint.update} className="absolute top-5 right-5" />
                {phase === 'offer' && (
                  <>
                    <div className="flex items-center gap-6">
                      <Companion pose="cheer" say={pl.upgrade.readySay} size={170} />
                      <House progress={0} />
                    </div>
                    <h2 className="font-display text-5xl font-extrabold tracking-tight">{pl.upgrade.ready}</h2>
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
                    <div className="flex items-center gap-6">
                      <Companion pose="thinking" say={pl.upgrade.installingSay} size={150} />
                      <House progress={progress} />
                    </div>
                    <div className="h-5 w-full overflow-hidden rounded-full bg-butter-100 ring-1 ring-butter-200" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full w-full origin-left rounded-full bg-[repeating-linear-gradient(90deg,var(--color-peach-400)_0_22px,var(--color-peach-300)_22px_24px)]" style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
                    </div>
                  </>
                )}
                {phase === 'new' && (
                  <>
                    <Companion pose="cheer" say={pl.upgrade.doneSay} size={150} />
                    <ul className="grid w-full grid-cols-2 gap-4 text-left">
                      {pl.upgrade.features.map((f, i) => (
                        <motion.li
                          key={f.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.25 }}
                          data-app={i === 0 ? 'notes' : 'web'}
                          className="tile flex flex-col gap-3 rounded-[28px] p-6"
                        >
                          <span className="grid size-14 place-items-center rounded-[18px] bg-white text-accent-strong shadow-button">
                            {i === 0 ? <BookOpenText size={32} weight="bold" /> : <SunHorizon size={32} weight="bold" />}
                          </span>
                          <span className="block font-display text-3xl font-extrabold text-accent-deep">{f.title}</span>
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


/** The "restart": the door to the new room swings open and light spills out. */
function Door() {
  return (
    <svg viewBox="0 0 160 200" width={160} height={200} aria-hidden>
      <motion.ellipse cx="80" cy="110" rx="90" ry="100" fill="var(--color-butter-200)" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 0.35, scale: 1 }} transition={{ delay: 0.9, duration: 1 }} style={{ transformOrigin: '80px 110px' }} />
      <rect x="30" y="20" width="100" height="170" rx="14" fill="var(--color-butter-100)" />
      <motion.g initial={{ scaleX: 1 }} animate={{ scaleX: 0.12 }} transition={{ delay: 0.6, duration: 1.1, ease: [0.4, 0, 0.2, 1] }} style={{ transformOrigin: '30px 100px', transformBox: 'view-box' }}>
        <rect x="30" y="20" width="100" height="170" rx="14" fill="var(--color-peach-400)" />
        <rect x="44" y="36" width="72" height="56" rx="8" fill="var(--color-peach-300)" />
        <rect x="44" y="104" width="72" height="70" rx="8" fill="var(--color-peach-300)" />
        <circle cx="114" cy="110" r="6" fill="var(--color-butter-300)" />
      </motion.g>
    </svg>
  )
}
