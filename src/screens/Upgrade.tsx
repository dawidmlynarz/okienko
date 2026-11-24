import { BookOpenText, SunHorizon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Companion } from '../components/Companion'
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

  const stepIdx = Math.min(pl.upgrade.steps.length - 1, Math.floor(progress * pl.upgrade.steps.length))

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
                <span className="font-display text-4xl font-extrabold">{pl.upgrade.restarting}</span>
              </motion.div>
            ) : (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="card relative flex max-h-full w-full max-w-4xl flex-col items-center gap-5 overflow-hidden rounded-[40px] p-10 text-center"
              >
                {phase === 'offer' && (
                  <>
                    <div className="flex items-center gap-6">
                      <Companion pose="cheer" say={pl.upgrade.readySay} size={170} />
                      <Building progress={0} />
                    </div>
                    <h2 className="font-display text-5xl font-extrabold tracking-tight">{pl.upgrade.ready}</h2>
                    <p className="text-2xl text-muted">{pl.upgrade.readyLead}</p>
                    <div className="flex gap-4">
                      <Button variant="plain" size="lg" onClick={() => setUpgradeOpen(false)}>
                        {pl.upgrade.later}
                      </Button>
                      <Button variant="strong" size="lg" onClick={() => setPhase('installing')}>
                        {pl.upgrade.install}
                      </Button>
                    </div>
                    <WhatIsIt />
                  </>
                )}
                {phase === 'installing' && (
                  <>
                    <div className="flex items-center gap-6">
                      <Companion pose="thinking" say={pl.upgrade.installingSay} size={150} />
                      <Building progress={progress} />
                    </div>
                    <h2 className="font-display text-4xl font-extrabold tracking-tight">{pl.upgrade.installing}</h2>
                    <div className="h-5 w-full overflow-hidden rounded-full bg-butter-100 ring-1 ring-butter-200" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full w-full origin-left rounded-full bg-[repeating-linear-gradient(90deg,var(--color-peach-400)_0_22px,var(--color-peach-300)_22px_24px)]" style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
                    </div>
                    <div className="flex w-full justify-between text-xl">
                      <AnimatePresence mode="wait">
                        <motion.span key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-muted">
                          {pl.upgrade.steps[stepIdx]}
                        </motion.span>
                      </AnimatePresence>
                      <span className="font-display font-bold tabular-nums text-peach-900">{Math.round(progress * 100)}%</span>
                    </div>
                    <p className="text-lg text-muted">{pl.upgrade.dontClose}</p>
                  </>
                )}
                {phase === 'new' && (
                  <>
                    <Companion pose="cheer" say={pl.upgrade.doneSay} size={150} />
                    <h2 className="font-display text-5xl font-extrabold tracking-tight">{pl.upgrade.whatsNew}</h2>
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
                          <span className="block font-display text-2xl font-extrabold text-accent-deep">{f.title}</span>
                          <span className="text-xl text-ink-700">{f.body}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <Button variant="strong" size="lg" onClick={() => setUpgradeOpen(false)}>
                      {pl.upgrade.ok}
                    </Button>
                    <WhatIsIt />
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

function WhatIsIt() {
  return <p className="max-w-xl rounded-full bg-ink-50 px-5 py-2 text-base text-ink-700">{pl.upgrade.whatIsIt}</p>
}

/** Smoczek's house with the new room going up brick by brick as the update runs. */
function Building({ progress }: { progress: number }) {
  const rows = 8
  const shown = Math.floor(progress * (rows + 3))
  const roof = shown > rows
  const windowOn = shown > rows + 1
  return (
    <svg viewBox="0 0 300 200" width={300} height={200} aria-hidden>
      <ellipse cx="150" cy="190" rx="140" ry="8" fill="var(--color-ink-900)" opacity=".06" />
      {/* The house she already has */}
      <path d="M20 90 L90 34 L160 90" fill="var(--color-sky-300)" />
      <path d="M14 94 L90 30 L166 94" fill="none" stroke="var(--color-peach-500)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="32" y="88" width="116" height="98" rx="10" fill="var(--color-sky-300)" />
      <rect x="54" y="106" width="34" height="34" rx="6" fill="var(--color-butter-100)" />
      <path d="M71 106v34M54 123h34" stroke="var(--color-sky-400)" strokeWidth="4" />
      <rect x="100" y="128" width="30" height="58" rx="8" fill="var(--color-sky-600)" />
      {/* The new room */}
      <rect x="156" y="88" width="120" height="98" rx="10" fill="none" stroke="var(--color-ink-300)" strokeWidth="3" strokeDasharray="8 7" />
      {Array.from({ length: rows }, (_, i) => (
        <motion.g key={i} initial={false} animate={{ opacity: i < shown ? 1 : 0, y: i < shown ? 0 : -30 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
          {Array.from({ length: 4 }, (_, j) => {
            const off = i % 2 ? 15 : 0
            const x = 158 + j * 30 + off
            const w = Math.min(28, 274 - x)
            return w > 4 ? <rect key={j} x={x} y={174 - i * 12} width={w} height={10} rx="2.5" fill={(i + j) % 3 ? 'var(--color-peach-300)' : 'var(--color-peach-400)'} /> : null
          })}
          {i % 2 === 1 && <rect x={158} y={174 - i * 12} width={13} height={10} rx="2.5" fill="var(--color-peach-300)" />}
        </motion.g>
      ))}
      <motion.path d="M150 92 L216 40 L282 92" fill="none" stroke="var(--color-pink-500)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ opacity: roof ? 1 : 0, y: roof ? 0 : -40 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} />
      <motion.g initial={false} animate={{ opacity: windowOn ? 1 : 0, scale: windowOn ? 1 : 0.4 }} style={{ transformOrigin: '216px 128px', transformBox: 'view-box' }}>
        <defs>
          <linearGradient id="up-sunset" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-lavender-300)" />
            <stop offset="1" stopColor="var(--color-peach-300)" />
          </linearGradient>
        </defs>
        <rect x="192" y="106" width="48" height="44" rx="8" fill="url(#up-sunset)" stroke="#fff" strokeWidth="5" />
        <circle cx="216" cy="140" r="9" fill="var(--color-butter-200)" />
      </motion.g>
    </svg>
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
