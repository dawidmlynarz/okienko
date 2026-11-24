import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Companion } from '../../components/Companion'
import { Picture } from '../../components/Picture'
import type { Pose } from '../../components/Smoczek'
import data from '../../content/lap-biedronki.json'
import { pl } from '../../i18n/pl'
import { useTypedKeys } from '../../keyboard/useKeys'
import { burst, celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import type { AppProps } from '../registry'
import { GameHud, GameShell, starsFor, type LevelBase, type RoundProps } from '../shared/GameKit'

interface Level extends LevelBase {
  size: number
  lifeMs: number
  count: number
  moving: boolean
}
const levels = data.levels as Level[]

export default function LapBiedronki(_: AppProps) {
  return <GameShell levels={levels} lead={pl.ladybugs.lead} hint={pl.parentHint.games['lap-biedronki']} backdrop={<Garden />} className="bg-mint-50" Round={Round} />
}

/** Flat garden: soft sky, rolling grass and a few big leaves to land on. */
function Garden() {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="lb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-butter-50)" />
          <stop offset="1" stopColor="var(--color-mint-50)" />
        </linearGradient>
      </defs>
      <rect width="1440" height="800" fill="url(#lb-sky)" />
      <circle cx="1240" cy="120" r="70" fill="var(--color-butter-200)" />
      <path d="M0 560 Q 360 500 720 540 T 1440 520 V 800 H 0 Z" fill="var(--color-mint-100)" />
      <path d="M0 660 Q 480 610 960 650 T 1440 640 V 800 H 0 Z" fill="var(--color-mint-200)" />
      {[
        [180, 300, -20],
        [520, 220, 15],
        [900, 330, -10],
        [1180, 420, 25],
        [320, 560, 10],
        [760, 600, -18],
        [1100, 640, 8],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} opacity=".9">
          <path d="M0 -90 C 70 -60 70 60 0 90 C -70 60 -70 -60 0 -90 Z" fill={i % 2 ? 'var(--color-mint-300)' : 'var(--color-mint-200)'} />
          <path d="M0 -84 V 84" stroke="var(--color-mint-400)" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  )
}

interface Bug {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  angle: number
}

function Round({ level, onDone, onBack }: RoundProps<Level>) {
  const [n, setN] = useState(0)
  const [bug, setBug] = useState<Bug | null>(null)
  const [caughtId, setCaughtId] = useState<number | null>(null)
  const [caught, setCaught] = useState(0)
  const [talk, setTalk] = useState<{ text: string | null; say?: string; pose: Pose; key: number }>({ text: pl.ladybugs.show, say: pl.ladybugs.startSay, pose: 'happy', key: 0 })
  const field = useRef<HTMLDivElement>(null)
  const caughtRef = useRef(0)
  const tell = useCallback((text: string | null, pose: Pose, say?: string) => setTalk((c) => ({ text, pose, say: say ?? '', key: c.key + 1 })), [])

  useTypedKeys((k) => {
    if (k.kind === 'escape') onBack()
  })

  const done = useRef(onDone)
  done.current = onDone
  const finish = useCallback(() => {
    play('fanfare')
    celebrate()
    const c = caughtRef.current
    window.setTimeout(() => done.current(starsFor(c, level.count), `${c} / ${level.count}`), 700)
  }, [level.count])

  // Land the next ladybug somewhere new; it flies off by itself after lifeMs.
  useEffect(() => {
    if (n >= level.count) {
      finish()
      return
    }
    const spawn = window.setTimeout(
      () => {
        const angle = Math.random() * Math.PI * 2
        const speed = level.moving ? 6 + Math.random() * 6 : 0
        setBug({ id: n, x: 12 + Math.random() * 76, y: 14 + Math.random() * 62, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, angle: (angle * 180) / Math.PI + 90 })
        play('whoosh')
      },
      n === 0 ? 1800 : 550,
    )
    const leave = window.setTimeout(() => {
      setBug(null)
      setN((v) => v + 1)
    }, (n === 0 ? 1800 : 550) + level.lifeMs)
    return () => {
      window.clearTimeout(spawn)
      window.clearTimeout(leave)
    }
  }, [n, level, finish])

  const catchIt = (b: Bug, e: React.MouseEvent) => {
    if (caughtId === b.id) return
    setCaughtId(b.id)
    caughtRef.current += 1
    setCaught(caughtRef.current)
    play('pop')
    window.setTimeout(() => play('correct'), 80)
    burst(e.clientX / window.innerWidth, e.clientY / window.innerHeight)
    const praise = pl.game.correct[Math.floor(Math.random() * pl.game.correct.length)]
    tell(praise, 'happy', caughtRef.current % 3 === 0 ? praise : '')
    window.setTimeout(() => {
      setBug(null)
      setN((v) => v + 1)
    }, 420)
  }

  return (
    <div className="flex h-full flex-col">
      <GameHud onBack={onBack} done={n} total={level.count} title={level.title} label={pl.ladybugs.caught(caught, level.count)} />
      <div ref={field} className="relative min-h-0 flex-1">
        <AnimatePresence>
          {bug && (
            <motion.button
              key={bug.id}
              type="button"
              aria-label="Biedronka"
              onClick={(e) => catchIt(bug, e)}
              className="absolute grid cursor-pointer place-items-center rounded-full"
              style={{ left: `${bug.x}%`, top: `${bug.y}%`, width: level.size, height: level.size, marginLeft: -level.size / 2, marginTop: -level.size / 2 }}
              initial={{ scale: 0, y: -80, opacity: 0, rotate: bug.angle - 40 }}
              animate={
                caughtId === bug.id
                  ? { scale: 1.3, opacity: 0, y: -160, rotate: bug.angle + 180, transition: { duration: 0.45, ease: 'easeIn' } }
                  : { scale: 1, y: 0, opacity: 1, rotate: bug.angle, x: bug.dx * (level.lifeMs / 1000) * 5, transition: { scale: { type: 'spring', stiffness: 380, damping: 18 }, y: { type: 'spring', stiffness: 260, damping: 20 }, x: { duration: level.lifeMs / 1000, ease: 'linear' }, opacity: { duration: 0.2 } } }
              }
              exit={{ y: -260, x: 120, opacity: 0, scale: 0.6, transition: { duration: 0.6, ease: 'easeIn' } }}
            >
              <TimerRing ms={level.lifeMs} size={level.size} />
              <motion.span
                animate={level.moving && caughtId !== bug.id ? { y: [0, bug.dy * 8, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative grid place-items-center"
              >
                <Picture id="biedronka" size={level.size * 0.78} />
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
        <div className="pointer-events-none absolute bottom-2 left-6 z-10">
          <Companion text={talk.text} say={talk.say} sayKey={talk.key} pose={talk.pose} size={130} narrow />
        </div>
      </div>
    </div>
  )
}

/** A soft ring that empties while the ladybug waits, so she can see time passing without stress. */
function TimerRing({ ms, size }: { ms: number; size: number }) {
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  return (
    <svg className="pointer-events-none absolute inset-0" width={size} height={size} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="rgb(255 255 255 / 0.55)" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-peach-500)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: c }}
        transition={{ duration: ms / 1000, ease: 'linear' }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
