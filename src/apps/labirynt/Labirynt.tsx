import { afterTalk } from '../../lib/speak'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Companion } from '../../components/Companion'
import { Picture } from '../../components/Picture'
import type { Pose } from '../../components/Smoczek'
import data from '../../content/labirynt.json'
import { pl } from '../../i18n/pl'
import { useTypedKeys } from '../../keyboard/useKeys'
import { burst, celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import type { AppProps } from '../registry'
import { ArrowPad, useArrowKeys, type Dir } from '../shared/ArrowPad'
import { GameHud, GameShell, starsFor, type LevelBase, type RoundProps } from '../shared/GameKit'
import { generate, isOpen, samePos, shortest, step, type Maze, type Pos } from './maze'

interface Level extends LevelBase {
  w: number
  h: number
  key: boolean
  mazes: number
}
const levels = data.levels as Level[]
const pickOne = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]
const cellId = (p: Pos) => `${p.x},${p.y}`

/** A maze counts as "good" when she got there without much wandering. */
const goodEnough = (moves: number, best: number) => moves <= best + Math.max(4, Math.ceil(best * 0.5))

export default function Labirynt(_: AppProps) {
  return <GameShell levels={levels} lead={pl.labirynt.lead} hint={pl.parentHint.games.labirynt} backdrop={<Garden />} className="bg-mint-50" Round={Round} />
}

/** A sunny garden behind the hedge maze. */
function Garden() {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="lb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-butter-100)" />
          <stop offset="1" stopColor="var(--color-mint-50)" />
        </linearGradient>
      </defs>
      <rect width="1440" height="800" fill="url(#lb-sky)" />
      <path d="M0 470 Q 360 420 720 460 T 1440 440 V 800 H 0 Z" fill="var(--color-mint-100)" />
      <g fill="var(--color-mint-200)" opacity=".8">
        <circle cx="90" cy="700" r="70" />
        <circle cx="1350" cy="680" r="90" />
      </g>
    </svg>
  )
}

interface Talk {
  text: string | null
  say?: string
  pose: Pose
  key: number
}

function Round({ level, onDone, onBack }: RoundProps<Level>) {
  // A fresh set of mazes every time the round starts.
  const mazes = useMemo(() => Array.from({ length: level.mazes }, () => generate(level.w, level.h, Math.floor(Math.random() * 1e9) + 1, level.key)), [level])
  const [idx, setIdx] = useState(0)
  const maze = mazes[idx]
  const [mouse, setMouse] = useState<Pos>(maze.start)
  const [trail, setTrail] = useState<string[]>([cellId(maze.start)])
  const [hasKey, setHasKey] = useState(false)
  const [bumps, setBumps] = useState(0)
  const [won, setWon] = useState(false)
  const intro = () => (level.key ? { text: pl.labirynt.showKey, say: pl.labirynt.sayKey } : { text: pl.labirynt.show, say: pl.labirynt.say })
  const [talk, setTalk] = useState<Talk>({ ...intro(), pose: 'happy', key: 0 })
  const tell = useCallback((text: string | null, pose: Pose, say?: string) => setTalk((c) => ({ text, pose, say: say ?? '', key: c.key + 1 })), [])

  const good = useRef(0)
  const moves = useRef(0)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  const stops = useRef<(() => void)[]>([])
  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout)
    stops.current.forEach((f) => f())
  }, [])

  const arrive = () => {
    if (goodEnough(moves.current, shortest(maze))) good.current += 1
    setWon(true)
    play('correct')
    burst(0.5, 0.45)
    tell(pickOne(pl.labirynt.home), 'cheer', pickOne(pl.labirynt.homeSay))
    stops.current.push(afterTalk(() => {
      if (idx + 1 >= mazes.length) {
        play('fanfare')
        celebrate()
        later(() => onDone(starsFor(good.current, mazes.length), pl.labirynt.resultLine(good.current, mazes.length)), 700)
        return
      }
      const next = mazes[idx + 1]
      setIdx(idx + 1)
      setMouse(next.start)
      setTrail([cellId(next.start)])
      setHasKey(false)
      setWon(false)
      moves.current = 0
      tell(pl.labirynt.next, 'happy', '')
    }, 1800))
  }

  const move = (dir: Dir) => {
    if (won) return
    const r = step(maze, mouse, dir, hasKey)
    if ('blocked' in r) {
      setBumps((b) => b + 1)
      play('tick')
      if (r.blocked === 'door') tell(pl.labirynt.locked, 'thinking', pl.labirynt.lockedSay)
      else if (bumps % 4 === 0) tell(pl.labirynt.wall, 'thinking', pickOne(pl.labirynt.wallSay))
      return
    }
    moves.current += 1
    play('click')
    setMouse(r.to)
    setTrail((t) => (t.includes(cellId(r.to)) ? t : [...t, cellId(r.to)]))
    if (maze.key && !hasKey && samePos(r.to, maze.key)) {
      setHasKey(true)
      play('pop')
      burst(0.5, 0.4)
      tell(pl.labirynt.gotKey, 'cheer', pl.labirynt.gotKeySay)
    }
    if (samePos(r.to, maze.goal)) arrive()
  }

  // Holding an arrow keeps the mouse running down a corridor.
  useArrowKeys(move, 150)
  useTypedKeys((k) => {
    if (k.kind === 'escape') onBack()
  })

  return (
    <div className="flex h-full flex-col">
      <GameHud onBack={onBack} done={idx + (won ? 1 : 0)} total={mazes.length} title={level.title} />
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 pb-5">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.25 }}>
            <MazeView maze={maze} mouse={mouse} trail={trail} hasKey={hasKey} bumps={bumps} won={won} />
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute top-[36%] left-6 z-10 -translate-y-1/2">
          <Companion text={talk.text} say={talk.say} sayKey={talk.key} pose={talk.pose} size={130} bubbleSide="top" narrow />
        </div>
        <div className="absolute right-6 bottom-6 z-10">
          <ArrowPad onArrow={move} disabled={won} />
        </div>
      </div>
    </div>
  )
}

/** Walls as one SVG path: every closed side once. */
function wallPath(m: Maze) {
  let d = ''
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) {
      const p = { x, y }
      if (!isOpen(m, p, 'up')) d += `M${x} ${y}H${x + 1}`
      if (!isOpen(m, p, 'left')) d += `M${x} ${y}V${y + 1}`
      if (x === m.w - 1 && !isOpen(m, p, 'right')) d += `M${x + 1} ${y}V${y + 1}`
      if (y === m.h - 1 && !isOpen(m, p, 'down')) d += `M${x} ${y + 1}H${x + 1}`
    }
  return d
}

/** The hedge maze: sandy paths, green hedges, dots where she has been, the cheese, and the key and door. */
function MazeView({ maze, mouse, trail, hasKey, bumps, won }: { maze: Maze; mouse: Pos; trail: string[]; hasKey: boolean; bumps: number; won: boolean }) {
  const walls = useMemo(() => wallPath(maze), [maze])
  const cw = 100 / maze.w
  const ch = 100 / maze.h
  const at = (p: Pos) => ({ left: `${p.x * cw}%`, top: `${p.y * ch}%`, width: `${cw}%`, height: `${ch}%` })
  const door = maze.door
  // The door sits on the shared side of its two cells.
  const doorLine = door && (door.a.x !== door.b.x ? { x1: Math.max(door.a.x, door.b.x), y1: door.a.y, x2: Math.max(door.a.x, door.b.x), y2: door.a.y + 1 } : { x1: door.a.x, y1: Math.max(door.a.y, door.b.y), x2: door.a.x + 1, y2: Math.max(door.a.y, door.b.y) })
  const lockAt = doorLine && { left: `${((doorLine.x1 + doorLine.x2) / 2) * cw}%`, top: `${((doorLine.y1 + doorLine.y2) / 2) * ch}%` }

  return (
    <div
      className="relative rounded-[28px] bg-mint-700 p-[min(14px,1.6vh)] shadow-card"
      style={{ width: `min(880px, 60vw, calc((100vh - 250px) * ${maze.w / maze.h}))` }}
      role="img"
      aria-label="Labirynt z myszką i serem"
    >
      <div className="relative rounded-[14px] bg-butter-100" style={{ aspectRatio: `${maze.w} / ${maze.h}` }}>
        <svg className="absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${maze.w} ${maze.h}`} aria-hidden>
          {trail.map((t) => {
            const [x, y] = t.split(',').map(Number)
            return <circle key={t} cx={x + 0.5} cy={y + 0.5} r={0.08} fill="var(--color-coral-300)" />
          })}
          <path d={walls} fill="none" stroke="var(--color-mint-700)" strokeWidth={0.16} strokeLinecap="round" />
          <AnimatePresence>
            {doorLine && !hasKey && (
              <motion.line key="door" {...doorLine} exit={{ opacity: 0 }} stroke="#A8662F" strokeWidth={0.2} strokeLinecap="round" strokeDasharray="0.12 0.08" />
            )}
          </AnimatePresence>
        </svg>

        <span className="absolute grid place-items-center" style={at(maze.goal)}>
          <motion.span animate={won ? { scale: 0, opacity: 0 } : { scale: [1, 1.08, 1] }} transition={won ? { duration: 0.3 } : { duration: 1.4, repeat: Infinity }} className="grid size-full place-items-center">
            <Picture id="ser" size="70%" />
          </motion.span>
        </span>

        <AnimatePresence>
          {maze.key && !hasKey && (
            <motion.span key="key" className="absolute grid place-items-center" style={at(maze.key)} animate={{ rotate: [-8, 8, -8] }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Picture id="klucz" size="62%" />
            </motion.span>
          )}
          {lockAt && !hasKey && (
            <motion.span key="lock" className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ ...lockAt, width: `${cw * 0.5}%`, height: `${ch * 0.5}%` }} exit={{ scale: 0, opacity: 0 }}>
              <Picture id="klodka" size="100%" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* The mouse glides from cell to cell. */}
        <motion.div
          className="pointer-events-none absolute grid place-items-center"
          style={{ width: `${cw}%`, height: `${ch}%` }}
          initial={false}
          animate={{ left: `${mouse.x * cw}%`, top: `${mouse.y * ch}%` }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        >
          <motion.span key={bumps} animate={bumps ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.35 }} className="relative grid size-full place-items-center">
            <Picture id="mysz" size="76%" />
            {hasKey && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-[4%] right-[4%] grid size-[40%] place-items-center rounded-full bg-white shadow-button">
                <Picture id="klucz" size="78%" />
              </motion.span>
            )}
          </motion.span>
        </motion.div>
      </div>
    </div>
  )
}
