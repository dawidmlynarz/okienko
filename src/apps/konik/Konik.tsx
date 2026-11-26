import { ArrowCounterClockwise, Play } from '@phosphor-icons/react'
import { firstThen, fresh } from '../../lib/bag'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Companion } from '../../components/Companion'
import { Picture } from '../../components/Picture'
import type { Pose } from '../../components/Smoczek'
import data from '../../content/konik.json'
import { pl } from '../../i18n/pl'
import { useTypedKeys } from '../../keyboard/useKeys'
import { burst, celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import { afterTalk, speak } from '../../lib/speak'
import type { AppProps } from '../registry'
import { ARROW, ArrowPad, useArrowKeys } from '../shared/ArrowPad'
import { GameHud, GameShell, starsFor, type LevelBase, type RoundProps } from '../shared/GameKit'
import { parseMap, runProgram, samePos, shortest, step, type Board, type Dir, type Pos } from './board'

interface Level extends LevelBase {
  mode: 'live' | 'plan'
  maps: string[][]
}
const levels = data.levels as Level[]

/** Most arrow cards that fit under the board. The longest map needs 10. */
const MAX_CARDS = 12
const STEP_MS = 420
/** How many steps per map the friend names out loud ("w lewo", "w prawo"). */
const SAY_DIRS = 3

const pickOne = fresh

export default function Konik(_: AppProps) {
  return <GameShell levels={levels} lead={pl.konik.lead} hint={pl.parentHint.games.konik} backdrop={<Meadow />} className="bg-mint-50" Round={Round} />
}

/** Soft sky over rolling meadow hills. */
function Meadow() {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="kn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-sky-100)" />
          <stop offset="1" stopColor="var(--color-mint-50)" />
        </linearGradient>
      </defs>
      <rect width="1440" height="800" fill="url(#kn-sky)" />
      <circle cx="1260" cy="110" r="60" fill="var(--color-butter-200)" />
      <path d="M0 380 Q 300 320 620 370 T 1440 350 V 800 H 0 Z" fill="var(--color-mint-100)" />
      <path d="M0 560 Q 420 500 900 550 T 1440 530 V 800 H 0 Z" fill="var(--color-mint-200)" opacity=".7" />
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
  const boards = useMemo(() => level.maps.map(parseMap), [level])
  const [mapIdx, setMapIdx] = useState(0)
  const board = boards[mapIdx]
  const [horse, setHorse] = useState<Pos>(board.horse)
  const [facing, setFacing] = useState<'left' | 'right'>(board.stable.x >= board.horse.x ? 'right' : 'left')
  const [eaten, setEaten] = useState<string[]>([])
  const [bumps, setBumps] = useState(0)
  const [cards, setCards] = useState<Dir[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [badCard, setBadCard] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [won, setWon] = useState(false)
  const plan = level.mode === 'plan'
  const [talk, setTalk] = useState<Talk>(() => ({ text: plan ? pl.konik.showPlan : pl.konik.showLive, say: plan ? firstThen('konik-plan', pl.konik.sayPlan, pl.konik.planAgain) : firstThen('konik-live', pl.konik.sayLive, pl.konik.liveAgain), pose: 'happy', key: 0 }))
  const tell = useCallback((text: string | null, pose: Pose, say?: string) => setTalk((c) => ({ text, pose, say: say ?? '', key: c.key + 1 })), [])

  // Scoring: a map is "good" if solved on the first Start (plan) or without many extra steps (live).
  const good = useRef(0)
  const moves = useRef(0)
  const tries = useRef(0)
  // Directions are named aloud only for the first few steps of a map, so she learns the words without hearing them on every key.
  const named = useRef(0)
  const nameDir = (dir: Dir) => {
    if (named.current >= SAY_DIRS) return
    named.current += 1
    speak(pl.konik.dirs[dir])
  }
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  const stops = useRef<(() => void)[]>([])
  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout)
    stops.current.forEach((f) => f())
  }, [])

  const reset = useCallback((b: Board) => {
    setHorse(b.horse)
    setFacing(b.stable.x >= b.horse.x ? 'right' : 'left')
    setEaten([])
    setCards([])
    setActive(null)
    setBadCard(null)
    setWon(false)
    moves.current = 0
    tries.current = 0
    named.current = 0
  }, [])

  const eat = (p: Pos) => {
    if (board.cells[p.y][p.x] === 'carrot') {
      const id = `${p.x},${p.y}`
      setEaten((e) => (e.includes(id) ? e : [...e, id]))
      play('pop')
    }
  }

  const arrive = () => {
    const firstTime = plan ? tries.current === 1 : moves.current <= shortest(board) + 2
    if (firstTime) good.current += 1
    setWon(true)
    play('correct')
    burst(0.5, 0.45)
    tell(pickOne(pl.konik.home), 'cheer', pickOne(pl.konik.homeSay))
    stops.current.push(afterTalk(() => {
      if (mapIdx + 1 >= boards.length) {
        play('fanfare')
        celebrate()
        later(() => onDone(starsFor(good.current, boards.length), pl.konik.resultLine(good.current, boards.length)), 700)
      } else {
        setMapIdx(mapIdx + 1)
        reset(boards[mapIdx + 1])
      }
    }, 1900))
  }

  /* Live mode: each arrow moves the horse right away. */
  const move = (dir: Dir) => {
    if (busy || won) return
    moves.current += 1
    if (dir === 'left' || dir === 'right') setFacing(dir)
    const next = step(board, horse, dir)
    if (!next) {
      setBumps((b) => b + 1)
      play('wrong')
      tell(pl.konik.bump, 'thinking', pl.konik.bumpSay)
      return
    }
    play('click')
    nameDir(dir)
    setHorse(next)
    eat(next)
    if (samePos(next, board.stable)) arrive()
  }

  /* Plan mode: lay cards, then run them. */
  const addCard = (dir: Dir) => {
    if (busy || won) return
    if (cards.length >= MAX_CARDS) {
      play('wrong')
      tell(pl.konik.full, 'thinking')
      return
    }
    play('click')
    nameDir(dir)
    setBadCard(null)
    setCards((c) => [...c, dir])
  }
  const removeCard = () => {
    if (busy || won || !cards.length) return
    play('click')
    setBadCard(null)
    setCards((c) => c.slice(0, -1))
  }
  const clearCards = () => {
    if (busy || won) return
    play('whoosh')
    setBadCard(null)
    setCards([])
  }

  const runPlan = () => {
    if (busy || won) return
    if (!cards.length) {
      tell(pl.konik.empty, 'thinking')
      return
    }
    tries.current += 1
    setBusy(true)
    tell(pl.konik.go, 'happy')
    setBadCard(null)
    setHorse(board.horse)
    const r = runProgram(board, cards)
    const steps = r.path.length - 1
    for (let i = 0; i < steps; i++) {
      later(() => {
        const d = cards[i]
        if (d === 'left' || d === 'right') setFacing(d)
        setActive(i)
        setHorse(r.path[i + 1])
        eat(r.path[i + 1])
        play('tick')
      }, (i + 1) * STEP_MS)
    }
    const end = (steps + 1) * STEP_MS
    later(() => {
      setActive(null)
      if (r.home) {
        setBusy(false)
        arrive()
        return
      }
      if (r.bumpAt !== null) {
        const d = cards[r.bumpAt]
        if (d === 'left' || d === 'right') setFacing(d)
        setBadCard(r.bumpAt)
        setBumps((b) => b + 1)
        play('wrong')
        tell(pl.konik.bump, 'thinking', pl.konik.bumpPlanSay)
      } else {
        play('wrong')
        tell(pl.konik.notHome, 'thinking', pl.konik.notHomeSay)
      }
      // Walk back to the start so she can fix the plan and try again.
      later(() => {
        setHorse(board.horse)
        setFacing(board.stable.x >= board.horse.x ? 'right' : 'left')
        setEaten([])
        setBusy(false)
      }, 1300)
    }, end)
  }

  const onArrow = (dir: Dir) => (plan ? addCard(dir) : move(dir))

  useArrowKeys(onArrow)

  useTypedKeys((k) => {
    if (k.kind === 'escape') onBack()
    else if (plan && k.kind === 'backspace') removeCard()
    else if (plan && k.kind === 'enter') runPlan()
  })

  return (
    <div className="flex h-full flex-col">
      <GameHud onBack={onBack} done={mapIdx + (won ? 1 : 0)} total={boards.length} title={level.title} />
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[min(20px,2.4vh)] px-6 pb-4">
        <BoardView board={board} horse={horse} facing={facing} eaten={eaten} bumps={bumps} won={won} />

        <div className="flex items-center gap-4">
          {plan && <CardStrip cards={cards} active={active} bad={badCard} />}
          <ArrowPad onArrow={onArrow} disabled={busy || won} />
          {plan && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={runPlan}
                disabled={busy || won}
                className="pressable flex h-[min(64px,8vh)] items-center gap-2 rounded-full bg-accent-strong px-7 font-display text-2xl font-bold text-white shadow-button disabled:opacity-60"
              >
                <Play size={26} weight="fill" />
                {pl.konik.start}
              </button>
              <button
                type="button"
                onClick={clearCards}
                disabled={busy || won || !cards.length}
                className="pressable flex h-11 items-center justify-center gap-2 rounded-full bg-white/85 px-4 font-display text-lg font-semibold text-accent-deep shadow-button disabled:opacity-50"
              >
                <ArrowCounterClockwise size={20} weight="bold" />
                {pl.konik.clear}
              </button>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute top-[38%] left-6 z-10 -translate-y-1/2">
          <Companion text={talk.text} say={talk.say} sayKey={talk.key} pose={talk.pose} size={130} bubbleSide="top" narrow />
        </div>
      </div>
    </div>
  )
}

/** The farm: a grid of grass tiles with trees, fences, a pond, carrots, the stable and the horse on top. */
function BoardView({ board, horse, facing, eaten, bumps, won }: { board: Board; horse: Pos; facing: 'left' | 'right'; eaten: string[]; bumps: number; won: boolean }) {
  const cellW = 100 / board.w
  const cellH = 100 / board.h
  return (
    <div
      className="relative shrink-0 rounded-[28px] bg-mint-300 p-2.5 shadow-card ring-1 ring-mint-600/20"
      style={{ width: `min(860px, 62vw, calc((100vh - 360px) * ${board.w / board.h}))` }}
      role="img"
      aria-label="Łąka z konikiem i stajnią"
    >
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${board.w}, 1fr)`, gridTemplateRows: `repeat(${board.h}, 1fr)`, aspectRatio: `${board.w} / ${board.h}` }}>
        {board.cells.flatMap((row, y) =>
          row.map((cell, x) => (
            <div key={`${x},${y}`} className="relative p-[3px]">
              <div className={`grid size-full place-items-center rounded-[14px] ${cell === 'pond' ? 'bg-sky-300' : (x + y) % 2 ? 'bg-mint-100' : 'bg-mint-200'}`}>
                {cell === 'tree' && <Picture id="drzewo" size="78%" />}
                {cell === 'fence' && <Fence />}
                {cell === 'pond' && <Waves />}
                {cell === 'stable' && <Stable open={won} />}
                {cell === 'carrot' && (
                  <AnimatePresence>
                    {!eaten.includes(`${x},${y}`) && (
                      <motion.span key="c" exit={{ scale: 0, rotate: 40, opacity: 0 }} className="grid size-full place-items-center">
                        <Picture id="marchewka" size="58%" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )),
        )}

        {/* The horse glides from tile to tile. */}
        <motion.div
          className="pointer-events-none absolute grid place-items-center"
          style={{ width: `${cellW}%`, height: `${cellH}%` }}
          initial={false}
          animate={{ left: `${horse.x * cellW}%`, top: `${horse.y * cellH}%`, scale: won ? 0.6 : 1, opacity: won ? 0 : 1 }}
          transition={{ left: { type: 'spring', stiffness: 320, damping: 28 }, top: { type: 'spring', stiffness: 320, damping: 28 }, scale: { delay: 0.35 }, opacity: { delay: 0.5 } }}
        >
          <motion.span
            key={bumps}
            animate={bumps ? { x: [0, -7, 7, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="grid size-full place-items-center"
          >
            <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.6 }} className="grid size-full place-items-center">
              {/* The Fluent horse faces left; mirror it to face right. */}
              <span className="grid size-full place-items-center" style={{ transform: facing === 'right' ? 'scaleX(-1)' : undefined }}>
                <Picture id="konik" size="84%" />
              </span>
            </motion.span>
          </motion.span>
        </motion.div>
      </div>
    </div>
  )
}

function Fence() {
  return (
    <svg viewBox="0 0 100 100" className="size-[86%]" aria-hidden>
      <g fill="#E3B27A" stroke="#7A4B2A" strokeWidth="4" strokeLinejoin="round">
        <rect x="8" y="34" width="84" height="12" rx="4" />
        <rect x="8" y="60" width="84" height="12" rx="4" />
        <path d="M14 88V26l8-10 8 10v62zM46 88V26l8-10 8 10v62zM74 88V26l8-10 8 10v62z" />
      </g>
    </svg>
  )
}

function Waves() {
  return (
    <svg viewBox="0 0 100 100" className="size-[80%]" aria-hidden>
      <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".85">
        <path d="M18 40q8-8 16 0t16 0 16 0" />
        <path d="M34 64q8-8 16 0t16 0 16 0" />
      </g>
    </svg>
  )
}

/** A little red barn. Its doors swing open when the horse arrives. */
function Stable({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="size-[96%] overflow-visible" aria-label="Stajnia">
      <g stroke="#5A1F1B" strokeWidth="4" strokeLinejoin="round">
        <path d="M14 46L50 14L86 46V92H14Z" fill="#E5484D" />
        <path d="M8 50L50 10L92 50" fill="none" strokeLinecap="round" stroke="#5A1F1B" strokeWidth="9" />
        <path d="M8 50L50 10L92 50" fill="none" strokeLinecap="round" stroke="#FFF6EC" strokeWidth="4" />
        <circle cx="50" cy="36" r="7" fill="#FFF6EC" />
        <rect x="32" y="56" width="36" height="36" fill={open ? '#5A1F1B' : '#FFF6EC'} />
        {!open && <path d="M32 56l36 36M68 56L32 92" stroke="#E5484D" strokeWidth="4" />}
      </g>
      {open && (
        <g stroke="#5A1F1B" strokeWidth="3" fill="#FFF6EC">
          <path d="M32 56l-12 4v36l12-4z" />
          <path d="M68 56l12 4v36l-12-4z" />
        </g>
      )}
    </svg>
  )
}

/** The plan: arrow cards in a row, lit one by one while the horse walks. */
function CardStrip({ cards, active, bad }: { cards: Dir[]; active: number | null; bad: number | null }) {
  return (
    <div className="glass-strong flex items-center gap-1.5 rounded-[24px] p-3" aria-label={cards.map((c) => pl.konik.dirs[c]).join(', ') || pl.konik.empty}>
      {Array.from({ length: MAX_CARDS }, (_, i) => {
        const d = cards[i]
        const tone = bad === i ? 'bg-coral-100 text-coral-900 shadow-[inset_0_0_0_3px_var(--color-coral-600)]' : active === i ? 'bg-accent-strong text-white' : 'bg-surface text-accent-strong shadow-[inset_0_0_0_1.5px_var(--color-ink-200)]'
        return (
          <div key={i} className="grid size-[min(52px,6.6vh)] place-items-center">
            <AnimatePresence mode="popLayout">
              {d ? (
                <motion.span
                  key={`${i}-${d}`}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: active === i ? 1.12 : 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className={`grid size-full place-items-center rounded-[14px] ${tone}`}
                >
                  {ARROW[d]({ size: 26, weight: 'fill' })}
                </motion.span>
              ) : (
                <span className="size-full rounded-[14px] border-2 border-dashed border-ink-200" />
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
