import { ArrowLeft, Star } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { ParentHint } from '../../components/ParentHint'
import { Smoczek } from '../../components/Smoczek'
import { speak } from '../../lib/speak'
import { pl } from '../../i18n/pl'
import { play } from '../../lib/sound'
import { useDomek } from '../../store/useDomek'

import { type LevelBase, type Stars } from './scoring'

export { shuffle, starsFor, type LevelBase, type Stars } from './scoring'

export interface RoundProps<L> {
  level: L
  /** Finish the round: stars plus the line Smoczek shows on the result card. */
  onDone: (stars: Stars, line: string) => void
  onBack: () => void
}

type View<L> = { kind: 'pick' } | { kind: 'play'; level: L; run: number } | { kind: 'result'; level: L; stars: Stars; line: string; run: number }

/**
 * The flow every game shares: pick a level, play a round, see the stars.
 * A game supplies its levels, a backdrop and a Round component.
 */
export function GameShell<L extends LevelBase>({
  levels,
  heading = pl.game.pickLevel,
  lead,
  hint,
  backdrop,
  className = '',
  Round,
}: {
  levels: L[]
  heading?: string
  /** Spoken when the level picker opens; not shown. */
  lead: string
  /** What the game teaches, for the parent's (?). */
  hint?: string
  backdrop?: ReactNode
  className?: string
  Round: (p: RoundProps<L>) => ReactNode
}) {
  const [view, setView] = useState<View<L>>({ kind: 'pick' })
  const addStars = useDomek((s) => s.addStars)
  const start = (level: L) => setView((v) => ({ kind: 'play', level, run: ('run' in v ? v.run : 0) + 1 }))

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {backdrop}
      <AnimatePresence mode="wait">
        {view.kind === 'pick' && (
          <motion.div key="pick" className="absolute inset-0" exit={{ opacity: 0 }}>
            <LevelPicker levels={levels} heading={heading} lead={lead} hint={hint} onPick={start} />
          </motion.div>
        )}
        {view.kind === 'play' && (
          <motion.div key={`play-${view.run}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Round
              level={view.level}
              onBack={() => setView({ kind: 'pick' })}
              onDone={(stars, line) => {
                addStars(view.level.id, stars)
                setView({ kind: 'result', level: view.level, stars, line, run: view.run })
              }}
            />
          </motion.div>
        )}
        {view.kind === 'result' && (
          <motion.div key="result" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Result stars={view.stars} line={view.line} onAgain={() => start(view.level)} onDone={() => setView({ kind: 'pick' })} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Each level card gets its own pastel, like category tiles. */
const LEVEL_TINTS = [
  { bg: 'var(--color-mint-100)', chip: 'var(--color-mint-200)', ink: 'var(--color-mint-900)' },
  { bg: 'var(--color-sky-100)', chip: 'var(--color-sky-200)', ink: 'var(--color-sky-900)' },
  { bg: 'var(--color-lavender-100)', chip: 'var(--color-lavender-200)', ink: 'var(--color-lavender-900)' },
  { bg: 'var(--color-peach-100)', chip: 'var(--color-peach-200)', ink: 'var(--color-peach-900)' },
]

export function LevelPicker<L extends LevelBase>({ levels, heading, lead, hint, onPick }: { levels: L[]; heading: string; lead: string; hint?: string; onPick: (l: L) => void }) {
  const progress = useDomek((s) => s.progress)
  useEffect(() => speak(`${lead}. ${heading}.`), [lead, heading])
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-8 p-8">
      {hint && <ParentHint text={hint} className="absolute top-5 right-6" />}
      <h2 className="font-display text-5xl font-extrabold tracking-tight text-ink">{heading}</h2>
      <div className="flex flex-wrap justify-center gap-5">
        {levels.map((l, i) => {
          const best = progress.levels[l.id] ?? 0
          const tint = LEVEL_TINTS[i % LEVEL_TINTS.length]
          return (
            <motion.button
              key={l.id}
              type="button"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 26 }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                play('pop')
                onPick(l)
              }}
              className="flex h-[min(300px,42vh)] w-60 flex-col items-center justify-between rounded-[32px] p-6 text-center shadow-card ring-1 ring-ink-900/5"
              style={{ background: tint.bg }}
            >
              <span
                className="grid size-20 place-items-center rounded-[24px] font-display text-4xl font-extrabold"
                style={{ background: tint.chip, color: tint.ink }}
              >
                {i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-2xl font-bold" style={{ color: tint.ink }}>
                  {l.title}
                </span>
                {l.subtitle && <span className="font-body text-xl text-ink-700">{l.subtitle}</span>}
              </span>
              {(
                <span className="flex gap-1" aria-label={`${best} z 3`}>
                  {[0, 1, 2].map((s) => (
                    <Star key={s} size={30} weight="fill" className={s < best ? 'text-butter-400 drop-shadow-[0_1px_0_var(--color-butter-600)]' : 'text-white'} />
                  ))}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/** The bar across the top of a round: back, progress, level name. */
export function GameHud({ onBack, done, total, title, label }: { onBack: () => void; done: number; total: number; title: string; label?: string }) {
  return (
    <div className="relative z-10 flex items-center gap-4 px-6 pt-4">
      <Button variant="plain" icon={<ArrowLeft size={24} weight="bold" />} onClick={onBack}>
        {pl.game.back}
      </Button>
      <div className="glass flex flex-1 items-center gap-4 rounded-full px-5 py-3" aria-label={label ?? `${done} z ${total}`}>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/70 ring-1 ring-ink-900/5">
          <motion.div className="h-full rounded-full bg-accent-strong" initial={false} animate={{ width: `${(Math.min(done, total) / total) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
        </div>
        <span className="font-display text-lg font-bold text-accent-deep tabular-nums">
          {Math.min(done, total)} / {total}
        </span>
      </div>
      <span className="glass rounded-full px-5 py-3 font-display text-lg font-bold text-accent-deep">{title}</span>
    </div>
  )
}

export function Result({ stars, line, onAgain, onDone }: { stars: Stars; line: string; onAgain: () => void; onDone: () => void }) {
  const color = useDomek((s) => s.profile?.companionColor)
  useEffect(() => {
    speak(pl.game.resultSay(stars))
    const ts = [0, 1, 2].filter((i) => i < stars).map((i) => window.setTimeout(() => play('star'), 500 + i * 350))
    return () => ts.forEach(window.clearTimeout)
  }, [stars])
  return (
    <div className="relative flex h-full items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="glass-strong relative flex w-full max-w-2xl flex-col items-center gap-5 overflow-hidden rounded-[36px] p-10 text-center"
      >
        <Sunburst />
        <h2 className="relative font-display text-5xl font-extrabold tracking-tight text-accent-deep">{stars === 3 ? 'Doskonale!' : stars === 2 ? 'Świetnie!' : 'Dobra robota!'}</h2>
        <div className="relative flex gap-4">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5 + i * 0.35, type: 'spring', stiffness: 400, damping: 14 }}>
              <Star size={84} weight="fill" className={i < stars ? 'text-butter-400 drop-shadow-[0_2px_0_var(--color-butter-600)]' : 'text-ink-100'} />
            </motion.span>
          ))}
        </div>
        <div className="relative flex items-center gap-5">
          <Smoczek pose="cheer" size={130} color={color} />
          <span className="rounded-full bg-accent-soft px-5 py-2 font-display text-3xl font-extrabold text-accent-deep tabular-nums">{line}</span>
        </div>
        <div className="relative flex gap-4">
          <Button variant="plain" size="lg" onClick={onDone}>
            {pl.game.finish}
          </Button>
          <Button variant="strong" size="lg" onClick={onAgain}>
            {pl.game.again}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

/** Soft rays behind the result, like a medal moment. */
function Sunburst() {
  return (
    <motion.svg
      viewBox="-100 -100 200 200"
      className="pointer-events-none absolute top-1/2 left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 opacity-60"
      initial={{ rotate: 0 }}
      animate={{ rotate: 30 }}
      transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
      aria-hidden
    >
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M0 0 L-7 -100 L7 -100 Z" fill="var(--color-butter-100)" transform={`rotate(${i * 22.5})`} />
      ))}
    </motion.svg>
  )
}
