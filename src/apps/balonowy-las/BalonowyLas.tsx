import { ArrowLeft, LockSimple, Star } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Button } from '../../components/Button'
import { Companion } from '../../components/Companion'
import { OnScreenKeyboard } from '../../components/OnScreenKeyboard'
import type { Pose } from '../../components/Smoczek'
import { pl } from '../../i18n/pl'
import { altKeyLabel, chordFor, detectPlatform, sameLetter } from '../../keyboard/polish'
import { useTypedKeys } from '../../keyboard/useKeys'
import { burst, celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import { letterName, speak } from '../../lib/speak'
import { useOkienko } from '../../store/useOkienko'
import type { AppProps } from '../registry'
import { levels, makeRound, starsFor, type Level } from './levels'

/** Balloon colours: pastel 300 fill, hue 900 letter (8:1+), 600 knot. */
const BALLOONS = [
  { fill: 'var(--color-pink-300)', ink: 'var(--color-pink-900)', edge: 'var(--color-pink-600)' },
  { fill: 'var(--color-sky-300)', ink: 'var(--color-sky-900)', edge: 'var(--color-sky-600)' },
  { fill: 'var(--color-lavender-300)', ink: 'var(--color-lavender-900)', edge: 'var(--color-lavender-600)' },
  { fill: 'var(--color-butter-300)', ink: 'var(--color-butter-900)', edge: 'var(--color-butter-600)' },
  { fill: 'var(--color-peach-300)', ink: 'var(--color-peach-900)', edge: 'var(--color-peach-600)' },
]

type View = { kind: 'pick' } | { kind: 'play'; level: Level } | { kind: 'result'; level: Level; firstTry: number; total: number; stars: 1 | 2 | 3 }

export default function BalonowyLas(_: AppProps) {
  const [view, setView] = useState<View>({ kind: 'pick' })
  // A new key per round so "again" starts a fresh round component.
  const [run, setRun] = useState(0)
  const play_ = (level: Level) => {
    setRun((r) => r + 1)
    setView({ kind: 'play', level })
  }
  const addStars = useOkienko((s) => s.addStars)

  return (
    <div className="absolute inset-0 overflow-hidden bg-mint-50">
      <Forest />
      <AnimatePresence mode="wait">
        {view.kind === 'pick' && (
          <motion.div key="pick" className="absolute inset-0" exit={{ opacity: 0 }}>
            <LevelPicker onPick={play_} />
          </motion.div>
        )}
        {view.kind === 'play' && (
          <motion.div key={`play-${run}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Round
              level={view.level}
              onBack={() => setView({ kind: 'pick' })}
              onDone={(firstTry, total) => {
                const stars = starsFor(firstTry, total)
                addStars(view.level.id, stars)
                setView({ kind: 'result', level: view.level, firstTry, total, stars })
              }}
            />
          </motion.div>
        )}
        {view.kind === 'result' && (
          <motion.div key="result" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Result {...view} onAgain={() => play_(view.level)} onDone={() => setView({ kind: 'pick' })} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Flat forest: two rows of rounded trees on mint hills. */
function Forest() {
  const back = [60, 190, 330, 470, 640, 780, 930, 1080, 1230, 1380]
  const front = [0, 140, 290, 1150, 1300, 1440]
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <rect width="1440" height="800" fill="var(--color-sky-100)" />
      <circle cx="1220" cy="120" r="60" fill="var(--color-butter-200)" />
      {back.map((x, i) => (
        <g key={x} transform={`translate(${x} ${560 + (i % 3) * 14})`}>
          <rect x="-7" y="40" width="14" height="70" rx="6" fill="var(--color-mint-700)" opacity=".5" />
          <ellipse cx="0" cy="10" rx="58" ry="72" fill="var(--color-mint-300)" />
        </g>
      ))}
      <path d="M0 680 Q 360 610 720 660 T 1440 640 V 800 H 0 Z" fill="var(--color-mint-200)" />
      {front.map((x, i) => (
        <g key={x} transform={`translate(${x} ${610 + (i % 2) * 20})`}>
          <rect x="-9" y="50" width="18" height="90" rx="8" fill="var(--color-mint-800)" opacity=".55" />
          <ellipse cx="0" cy="20" rx="76" ry="92" fill="var(--color-mint-400)" />
        </g>
      ))}
      <path d="M0 740 Q 480 700 960 735 T 1440 725 V 800 H 0 Z" fill="var(--color-mint-300)" />
    </svg>
  )
}

function LevelPicker({ onPick }: { onPick: (l: Level) => void }) {
  const progress = useOkienko((s) => s.progress)
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-8 p-8">
      <h2 className="rounded-full bg-surface/90 px-8 py-3 font-display text-4xl font-semibold text-mint-900 shadow-card">{pl.game.pickLevel}</h2>
      <div className="grid grid-cols-4 gap-5">
        {levels.map((l, i) => {
          const locked = progress.stars < l.unlockStars
          const best = progress.levels[l.id] ?? 0
          return (
            <motion.button
              key={l.id}
              type="button"
              disabled={locked}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
              onClick={() => {
                play('pop')
                onPick(l)
              }}
              className={`pressable flex w-60 flex-col items-center gap-3 rounded-lg p-6 text-center ${locked ? 'bg-ink-100 text-ink-700' : 'bg-surface text-ink'}`}
              style={{ '--edge': locked ? 'var(--color-ink-300)' : 'var(--color-mint-600)' } as CSSProperties}
            >
              <span className={`grid size-20 place-items-center rounded-full font-display text-3xl font-semibold ${locked ? 'bg-ink-200 text-ink-700' : 'bg-mint-200 text-mint-900'}`}>
                {locked ? <LockSimple size={36} weight="bold" /> : i + 1}
              </span>
              <span className="font-display text-2xl font-semibold">{l.title}</span>
              <span className="font-body text-xl text-muted">{l.subtitle}</span>
              {locked ? (
                <span className="text-base">{pl.game.locked(l.unlockStars)}</span>
              ) : (
                <span className="flex gap-1" aria-label={`${best} z 3 gwiazdek`}>
                  {[0, 1, 2].map((s) => (
                    <Star key={s} size={28} weight={s < best ? 'fill' : 'bold'} className={s < best ? 'text-butter-600' : 'text-ink-400'} />
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

interface BalloonState {
  id: number
  char: string
  x: number
  color: (typeof BALLOONS)[number]
}

function Round({ level, onDone, onBack }: { level: Level; onDone: (firstTry: number, total: number) => void; onBack: () => void }) {
  const platform = useMemo(() => detectPlatform(), [])
  const letters = useMemo(() => makeRound(level), [level])
  const [idx, setIdx] = useState(0)
  const [balloon, setBalloon] = useState<BalloonState | null>(null)
  const [popping, setPopping] = useState(false)
  const [missed, setMissed] = useState(false)
  const [hint, setHint] = useState(level.hintAfterMs === 0)
  const [wrongCode, setWrongCode] = useState<string | null>(null)
  const [wobble, setWobble] = useState(0)
  const [companion, setCompanion] = useState<{ text: string | null; say?: string; pose: Pose; key: number }>({ text: pl.game.startSay, pose: 'happy', key: 0 })
  const firstTry = useRef(0)
  const misses = useRef(0)
  const scene = useRef<HTMLDivElement>(null)
  const balloonEl = useRef<HTMLDivElement>(null)

  const tell = useCallback((text: string | null, pose: Pose, say?: string) => setCompanion((c) => ({ text, pose, say, key: c.key + 1 })), [])

  // Spawn the next balloon.
  useEffect(() => {
    if (idx >= letters.length) return
    const char = letters[idx]
    const t = window.setTimeout(
      () => {
        setBalloon({ id: idx, char, x: 22 + Math.random() * 56, color: BALLOONS[idx % BALLOONS.length] })
        setPopping(false)
        setMissed(false)
        misses.current = 0
        setHint(level.hintAfterMs === 0)
        play('whoosh')
        // Say the letter, so she hears it as well as sees it.
        if (idx > 0) speak(letterName(char))
      },
      idx === 0 ? 1600 : 450,
    )
    return () => window.clearTimeout(t)
  }, [idx, letters, level.hintAfterMs])

  // Hint glow after a delay on harder levels.
  useEffect(() => {
    if (!balloon || hint || level.hintAfterMs === 0) return
    const t = window.setTimeout(() => setHint(true), level.hintAfterMs)
    return () => window.clearTimeout(t)
  }, [balloon, hint, level.hintAfterMs])

  const instruction = (c: string) => {
    const ch = chordFor(c)
    const shown = c.toUpperCase()
    // Polish letters: name the base key printed on her keyboard (Key + A → "A").
    if (ch?.alt) return pl.game.pressAlt(altKeyLabel(platform), ch.code.slice(3))
    if (ch?.shift) return pl.game.pressShift(shown)
    return pl.game.pressKey(shown)
  }

  useTypedKeys((k, e) => {
    if (k.kind === 'escape') return onBack()
    if (!balloon || popping || k.kind !== 'char') return
    if (sameLetter(k.char, balloon.char)) {
      if (!missed) firstTry.current += 1
      setPopping(true)
      play('pop')
      window.setTimeout(() => play('correct'), 90)
      const r = balloonEl.current?.getBoundingClientRect()
      if (r) burst((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2.5) / window.innerHeight)
      const praise = pl.game.correct[Math.floor(Math.random() * pl.game.correct.length)]
      const last = idx + 1 >= letters.length
      tell(praise, last ? 'cheer' : 'happy', last || idx % 3 === 2 ? praise : '')
      window.setTimeout(() => {
        setBalloon(null)
        if (last) {
          play('fanfare')
          celebrate()
          window.setTimeout(() => onDone(firstTry.current, letters.length), 900)
        }
        setIdx((i) => i + 1)
      }, 380)
    } else {
      play('wrong')
      setMissed(true)
      setHint(true)
      setWobble((w) => w + 1)
      setWrongCode(e.code)
      window.setTimeout(() => setWrongCode(null), 350)
      misses.current += 1
      const say = misses.current >= 2 ? `${instruction(balloon.char)}.` : ''
      tell(misses.current >= 2 ? instruction(balloon.char) : pl.game.tryAgain, 'thinking', say || pl.game.tryAgain)
    }
  })

  const left = letters.length - idx
  return (
    <div className="flex h-full flex-col">
      {/* HUD */}
      <div className="relative z-10 flex items-center gap-4 px-6 pt-4">
        <Button variant="plain" icon={<ArrowLeft size={24} weight="bold" />} onClick={onBack}>
          {pl.game.back}
        </Button>
        <div className="flex flex-1 justify-center gap-2" aria-label={pl.game.balloonsLeft(left)}>
          {letters.map((_, i) => (
            <span key={i} className={`size-4 rounded-full ${i < idx ? 'bg-mint-600' : i === idx ? 'bg-mint-300 ring-4 ring-mint-600' : 'bg-surface ring-2 ring-mint-300'}`} />
          ))}
        </div>
        <span className="rounded-full bg-surface px-5 py-2 font-display text-xl font-semibold text-mint-900 shadow-card">{level.title}</span>
      </div>

      {/* Scene */}
      <div ref={scene} className="relative min-h-0 flex-1">
        <AnimatePresence>
          {balloon && (
            <motion.div
              key={balloon.id}
              ref={balloonEl}
              className="absolute top-0"
              style={{ left: `${balloon.x}%`, x: '-50%' }}
              initial={{ y: '120vh' }}
              animate={popping ? { y: '6vh', scale: 1.35, opacity: 0 } : { y: '6vh' }}
              exit={{ opacity: 0 }}
              transition={popping ? { duration: 0.22, ease: 'easeOut' } : { duration: level.riseMs / 1000, ease: [0.22, 0.8, 0.3, 1] }}
            >
              <motion.div key={wobble} animate={wobble ? { rotate: [0, -10, 9, -6, 4, 0] } : {}} transition={{ duration: 0.5 }} style={{ transformOrigin: '50% 90%' }}>
                <div className="balloon-bob">
                  <Balloon char={balloon.char} color={balloon.color} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-2 left-6 z-10">
          <Companion text={companion.text} say={companion.say} sayKey={companion.key} pose={companion.pose} size={150} />
        </div>
      </div>

      {/* Keyboard */}
      <div className="relative z-10 flex justify-center pb-5">
        <OnScreenKeyboard target={balloon?.char ?? null} hint={hint} wrongCode={wrongCode} platform={platform} compact />
      </div>
    </div>
  )
}

function Balloon({ char, color }: { char: string; color: (typeof BALLOONS)[number] }) {
  return (
    <svg viewBox="0 0 200 300" width={200} height={300} aria-label={`Balonik z literą ${char}`} role="img">
      <path d="M100 228 C 92 250, 112 262, 100 296" fill="none" stroke="var(--color-ink-600)" strokeWidth="3" strokeLinecap="round" />
      <path d="M100 6 C 160 6 190 56 190 110 C 190 170 140 214 100 222 C 60 214 10 170 10 110 C 10 56 40 6 100 6 Z" fill={color.fill} stroke={color.edge} strokeWidth="4" />
      <path d="M90 222 L110 222 L104 234 L96 234 Z" fill={color.edge} />
      <ellipse cx="58" cy="66" rx="16" ry="26" fill="#fff" opacity=".55" transform="rotate(-24 58 66)" />
      <text x="100" y="140" textAnchor="middle" dominantBaseline="middle" fontFamily="Andika, sans-serif" fontSize="112" fill={color.ink}>
        {char}
      </text>
    </svg>
  )
}

function Result({ firstTry, total, stars, onAgain, onDone }: { firstTry: number; total: number; stars: 1 | 2 | 3; onAgain: () => void; onDone: () => void }) {
  useEffect(() => {
    const ts = [0, 1, 2].filter((i) => i < stars).map((i) => window.setTimeout(() => play('star'), 500 + i * 350))
    return () => ts.forEach(window.clearTimeout)
  }, [stars])
  return (
    <div className="relative flex h-full items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-xl bg-surface p-10 text-center shadow-float"
      >
        <h2 className="font-display text-5xl font-semibold text-mint-900">{pl.game.done}</h2>
        <div className="flex gap-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5 + i * 0.35, type: 'spring', stiffness: 400, damping: 14 }}
            >
              <Star size={88} weight={i < stars ? 'fill' : 'bold'} className={i < stars ? 'text-butter-400' : 'text-ink-300'} />
            </motion.span>
          ))}
        </div>
        <Companion text={pl.game.accuracy(firstTry, total)} say={pl.game.resultSay(stars)} pose="cheer" size={170} />
        <div className="flex gap-4">
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
