import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Companion } from '../../components/Companion'
import { OnScreenKeyboard } from '../../components/OnScreenKeyboard'
import type { Pose } from '../../components/Smoczek'
import { pl } from '../../i18n/pl'
import { altKeyLabel, chordFor, detectPlatform, sameLetter } from '../../keyboard/polish'
import { useTypedKeys } from '../../keyboard/useKeys'
import { burst, celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import { letterName, speak } from '../../lib/speak'
import type { AppProps } from '../registry'
import { GameHud, GameShell, starsFor, type RoundProps } from '../shared/GameKit'
import { levels, makeRound, type Level } from './levels'

/** Balloon colours: pastel 300 fill, hue 900 letter (8:1+), 600 knot. */
const BALLOONS = [
  { fill: 'var(--color-pink-300)', ink: 'var(--color-pink-900)', edge: 'var(--color-pink-600)' },
  { fill: 'var(--color-sky-300)', ink: 'var(--color-sky-900)', edge: 'var(--color-sky-600)' },
  { fill: 'var(--color-lavender-300)', ink: 'var(--color-lavender-900)', edge: 'var(--color-lavender-600)' },
  { fill: 'var(--color-butter-300)', ink: 'var(--color-butter-900)', edge: 'var(--color-butter-600)' },
  { fill: 'var(--color-peach-300)', ink: 'var(--color-peach-900)', edge: 'var(--color-peach-600)' },
]

export default function BalonowyLas(_: AppProps) {
  return <GameShell levels={levels} lead="Wpisuj litery z baloników" backdrop={<Forest />} className="bg-mint-50" Round={BalloonRound} />
}

function BalloonRound({ level, onDone, onBack }: RoundProps<Level>) {
  return <Round level={level} onBack={onBack} onDone={(firstTry, total) => onDone(starsFor(firstTry, total), pl.game.accuracy(firstTry, total))} />
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
      <GameHud onBack={onBack} done={idx} total={letters.length} title={level.title} label={pl.game.balloonsLeft(left)} />

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
