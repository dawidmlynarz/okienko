import { ArrowLeft, LockSimple, Star } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

/** Soft flat forest: rounded tree shapes in three depths of mint, no outlines. */
function Forest() {
  const back = [60, 210, 380, 560, 760, 940, 1120, 1300]
  const front = [-20, 150, 1180, 1360]
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="bl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-sky-100)" />
          <stop offset="0.65" stopColor="var(--color-sky-50)" />
          <stop offset="1" stopColor="var(--color-mint-50)" />
        </linearGradient>
      </defs>
      <rect width="1440" height="800" fill="url(#bl-sky)" />
      {back.map((x, i) => (
        <g key={x} transform={`translate(${x} ${590 + (i % 3) * 16})`} opacity=".7">
          <rect x="-6" y="50" width="12" height="60" rx="6" fill="var(--color-mint-300)" />
          <ellipse cx="0" cy="10" rx="62" ry="78" fill="var(--color-mint-200)" />
        </g>
      ))}
      <path d="M0 690 Q 360 640 720 676 T 1440 660 V 800 H 0 Z" fill="var(--color-mint-100)" />
      {front.map((x, i) => (
        <g key={x} transform={`translate(${x} ${620 + (i % 2) * 24})`}>
          <rect x="-8" y="60" width="16" height="80" rx="8" fill="var(--color-mint-400)" opacity=".6" />
          <ellipse cx="0" cy="24" rx="84" ry="100" fill="var(--color-mint-300)" />
        </g>
      ))}
      <path d="M0 748 Q 480 718 960 744 T 1440 736 V 800 H 0 Z" fill="var(--color-mint-200)" />
    </svg>
  )
}

/** Each level card gets its own pastel, like category tiles. */
const LEVEL_TINTS = [
  { bg: 'var(--color-mint-100)', chip: 'var(--color-mint-200)', ink: 'var(--color-mint-900)' },
  { bg: 'var(--color-sky-100)', chip: 'var(--color-sky-200)', ink: 'var(--color-sky-900)' },
  { bg: 'var(--color-lavender-100)', chip: 'var(--color-lavender-200)', ink: 'var(--color-lavender-900)' },
  { bg: 'var(--color-peach-100)', chip: 'var(--color-peach-200)', ink: 'var(--color-peach-900)' },
]

function LevelPicker({ onPick }: { onPick: (l: Level) => void }) {
  const progress = useOkienko((s) => s.progress)
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-1">
        <h2 className="font-display text-5xl font-bold text-ink">{pl.game.pickLevel}</h2>
        <p className="text-2xl text-muted">Wpisuj litery z baloników</p>
      </div>
      <div className="grid grid-cols-4 gap-5">
        {levels.map((l, i) => {
          const locked = progress.stars < l.unlockStars
          const best = progress.levels[l.id] ?? 0
          const tint = LEVEL_TINTS[i % LEVEL_TINTS.length]
          return (
            <motion.button
              key={l.id}
              type="button"
              disabled={locked}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 26 }}
              whileHover={locked ? undefined : { y: -4 }}
              whileTap={locked ? undefined : { scale: 0.97 }}
              onClick={() => {
                play('pop')
                onPick(l)
              }}
              className="flex h-[300px] w-60 flex-col items-center justify-between rounded-[28px] p-6 text-center shadow-card disabled:cursor-default"
              style={{ background: locked ? 'var(--color-ink-50)' : tint.bg }}
            >
              <span
                className="grid size-20 place-items-center rounded-[24px] font-display text-4xl font-bold"
                style={{ background: locked ? 'var(--color-ink-100)' : tint.chip, color: locked ? 'var(--color-ink-700)' : tint.ink }}
              >
                {locked ? <LockSimple size={34} weight="bold" /> : i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-2xl font-bold" style={{ color: locked ? 'var(--color-ink-700)' : tint.ink }}>
                  {l.title}
                </span>
                <span className="font-body text-xl text-ink-700">{l.subtitle}</span>
              </span>
              {locked ? (
                <span className="text-base text-ink-700">{pl.game.locked(l.unlockStars)}</span>
              ) : (
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
        <div className="glass flex flex-1 items-center gap-4 rounded-full py-3 pr-5 pl-5" aria-label={pl.game.balloonsLeft(left)}>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-mint-100">
            <motion.div className="h-full rounded-full bg-mint-600" initial={false} animate={{ width: `${(idx / letters.length) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
          </div>
          <span className="font-display text-lg font-bold text-mint-900 tabular-nums">
            {Math.min(idx, letters.length)} / {letters.length}
          </span>
        </div>
        <span className="glass rounded-full px-5 py-3 font-display text-lg font-bold text-mint-900">{level.title}</span>
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
  const id = `bl-${color.edge.replace(/\W/g, '')}`
  return (
    <svg viewBox="0 0 200 300" width={210} height={315} aria-label={`Balonik z literą ${char}`} role="img" style={{ filter: 'drop-shadow(0 14px 18px rgb(27 34 64 / 0.12))' }}>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M100 226 C 94 248, 110 262, 100 296" fill="none" stroke="var(--color-ink-400)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M100 6 C 160 6 190 56 190 110 C 190 170 140 214 100 222 C 60 214 10 170 10 110 C 10 56 40 6 100 6 Z" fill={color.fill} />
      <path d="M100 6 C 160 6 190 56 190 110 C 190 170 140 214 100 222 C 60 214 10 170 10 110 C 10 56 40 6 100 6 Z" fill={`url(#${id})`} />
      <path d="M92 220 L108 220 L104 230 L96 230 Z" fill={color.edge} />
      <text x="100" y="138" textAnchor="middle" dominantBaseline="middle" fontFamily="Andika, sans-serif" fontSize="116" fill={color.ink}>
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
        className="glass-strong relative flex w-full max-w-2xl flex-col items-center gap-5 overflow-hidden rounded-[32px] p-10 text-center"
      >
        <Sunburst />
        <h2 className="relative font-display text-5xl font-bold text-mint-800">{stars === 3 ? 'Doskonale!' : stars === 2 ? 'Świetnie!' : 'Dobra robota!'}</h2>
        <p className="relative -mt-2 text-2xl text-muted">{pl.game.done}</p>
        <div className="relative flex gap-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5 + i * 0.35, type: 'spring', stiffness: 400, damping: 14 }}
            >
              <Star size={84} weight="fill" className={i < stars ? 'text-butter-400 drop-shadow-[0_2px_0_var(--color-butter-600)]' : 'text-ink-100'} />
            </motion.span>
          ))}
        </div>
        <Companion text={pl.game.accuracy(firstTry, total)} say={pl.game.resultSay(stars)} pose="cheer" size={160} className="relative" />
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
