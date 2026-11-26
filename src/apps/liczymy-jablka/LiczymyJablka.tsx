import { Plus } from '@phosphor-icons/react'
import { fresh, firstThen } from '../../lib/bag'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Companion } from '../../components/Companion'
import { Picture } from '../../components/Picture'
import type { Pose } from '../../components/Smoczek'
import data from '../../content/liczymy-jablka.json'
import { pl } from '../../i18n/pl'
import { usePressedCodes, useTypedKeys } from '../../keyboard/useKeys'
import { burst, celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import { afterTalk, speak } from '../../lib/speak'
import type { AppProps } from '../registry'
import { GameHud, GameShell, starsFor, type RoundProps } from '../shared/GameKit'
import { SPOTS, makeQuestions, type Level } from './questions'

const levels = data.levels as Level[]

export default function LiczymyJablka(_: AppProps) {
  return <GameShell levels={levels} lead={pl.counting.lead} hint={pl.parentHint.games['liczymy-jablka']} backdrop={<Backdrop />} className="bg-lavender-50" Round={Round} />
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute -top-40 left-1/4 size-[560px] rounded-full bg-lavender-100 blur-3xl" />
      <div className="absolute -right-24 -bottom-40 size-[480px] rounded-full bg-pink-100 blur-3xl" />
    </div>
  )
}

function Round({ level, onDone, onBack }: RoundProps<Level>) {
  const questions = useMemo(() => makeQuestions(level), [level])
  const [qi, setQi] = useState(0)
  const [missed, setMissed] = useState(false)
  const [solved, setSolved] = useState(false)
  const [hint, setHint] = useState(false)
  const [counting, setCounting] = useState(false)
  const [wrong, setWrong] = useState<number | null>(null)
  const [talk, setTalk] = useState<{ text: string | null; say?: string; pose: Pose; key: number }>({ text: null, pose: 'happy', key: 0 })
  const good = useRef(0)
  const tell = useCallback((text: string | null, pose: Pose, say?: string) => setTalk((c) => ({ text, pose, say: say ?? '', key: c.key + 1 })), [])
  const q = questions[qi]
  const ask = level.mode !== 'count' ? pl.counting.howManySum : pl.counting.howMany

  useEffect(() => {
    setMissed(false)
    setSolved(false)
    setHint(false)
    setCounting(false)
    // The full how-to once a session; after that a short, changing question (or none: the bubble asks).
    tell(ask, 'happy', qi === 0 ? firstThen('liczymy-jablka', pl.counting.startSay, level.mode !== 'count' ? pl.counting.askSumAgain : pl.counting.askAgain) : fresh(level.mode !== 'count' ? pl.counting.askSumAgain : pl.counting.askAgain))
  }, [qi, ask, tell])

  useEffect(() => {
    if (hint || solved) return
    const t = window.setTimeout(() => setHint(true), level.hintAfterMs)
    return () => window.clearTimeout(t)
  }, [qi, hint, solved, level.hintAfterMs])

  const answer = (n: number) => {
    if (!q || solved) return
    if (n === q.answer) {
      if (!missed) good.current += 1
      setSolved(true)
      play('correct')
      burst(0.5, 0.4)
      const last = qi + 1 >= questions.length
      tell(pl.counting.sayCount(n), last ? 'cheer' : 'happy', pl.counting.sayCount(n))
      afterTalk(() => {
        if (last) {
          play('fanfare')
          celebrate()
          window.setTimeout(() => onDone(starsFor(good.current, questions.length), `${good.current} / ${questions.length}`), 1000)
        } else setQi((i) => i + 1)
      }, 1300)
    } else {
      play('wrong')
      setMissed(true)
      setHint(true)
      setWrong(n)
      window.setTimeout(() => setWrong(null), 400)
      // Count together: number each apple, then name the key.
      setCounting(true)
      tell(pl.counting.hint(q.answer), 'thinking', '')
      const words = Array.from({ length: q.answer }, (_, i) => `${i + 1}`).join(', ')
      speak(`${fresh(pl.counting.together)} ${words}. Naciśnij ${q.answer}.`)
    }
  }

  useTypedKeys((k) => {
    if (k.kind === 'escape') return onBack()
    if (k.kind === 'char' && /^[1-9]$/.test(k.char)) answer(Number(k.char))
  })

  if (!q) return null
  let offset = 0
  return (
    <div className="flex h-full flex-col">
      <GameHud onBack={onBack} done={qi + (solved ? 1 : 0)} total={questions.length} title={level.title} />
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8">
        <h2 className="font-display text-4xl font-extrabold tracking-tight text-accent-deep">{ask}</h2>
        <AnimatePresence mode="wait">
          <motion.div key={qi} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="flex items-center gap-6">
            {q.plates.map((count, p) => {
              const start = offset
              offset += count
              return (
                <div key={p} className="flex items-center gap-6">
                  {p > 0 && (
                    <span className="grid size-16 place-items-center rounded-full bg-surface text-accent-strong shadow-button">
                      <Plus size={34} weight="bold" />
                    </span>
                  )}
                  <Plate count={count} start={start} counting={counting} solved={solved} small={q.plates.length > 2} />
                </div>
              )
            })}
            <AnimatePresence>
              {solved && (
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="ml-2 grid size-28 place-items-center rounded-[32px] bg-mint-100 font-display text-7xl font-extrabold text-mint-900 ring-2 ring-mint-400">
                  {q.answer}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute bottom-2 left-6 z-10">
          <Companion text={talk.text} say={talk.say} sayKey={talk.key} pose={talk.pose} size={120} narrow />
        </div>
      </div>
      <div className="relative z-10 flex justify-center pb-6">
        <DigitRow glow={hint && !solved ? q.answer : null} wrong={wrong} onPick={answer} />
      </div>
    </div>
  )
}

/** A plate of apples laid out like dice spots; when counting together, each apple gets its number. */
function Plate({ count, start, counting, solved, small }: { count: number; start: number; counting: boolean; solved: boolean; small?: boolean }) {
  const spots = SPOTS[count]
  // Three plates side by side need smaller ones, so Smoczek and his bubble still fit beside them.
  const cell = small ? 'min(64px, 7.5vh)' : 'min(84px, 9.5vh)'
  return (
    <motion.div animate={solved ? { scale: [1, 1.05, 1] } : {}} className="grid grid-cols-3 gap-2 rounded-[36px] bg-surface p-5 shadow-float ring-1 ring-ink-900/5">
      {Array.from({ length: 9 }, (_, cellIdx) => {
        const i = spots.indexOf(cellIdx)
        return (
          <span key={cellIdx} className="relative grid place-items-center" style={{ width: cell, height: cell }}>
            {i >= 0 && (
              <motion.span initial={{ scale: 0 }} animate={counting ? { scale: [1, 1.2, 1] } : { scale: 1 }} transition={counting ? { delay: (start + i) * 0.45, duration: 0.4 } : { delay: 0.1 + i * 0.05, type: 'spring', stiffness: 400, damping: 18 }}>
                <Picture id="jablko" size={cell} />
              </motion.span>
            )}
            {i >= 0 && counting && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: (start + i) * 0.45 }}
                className="absolute -top-1 -right-1 grid size-9 place-items-center rounded-full bg-accent-strong font-display text-lg font-bold text-white shadow-button"
              >
                {start + i + 1}
              </motion.span>
            )}
          </span>
        )
      })}
    </motion.div>
  )
}

/** The number row of the keyboard, 1 to 9. Click works too, but the glow teaches where the keys are. */
function DigitRow({ glow, wrong, onPick }: { glow: number | null; wrong: number | null; onPick: (n: number) => void }) {
  const pressed = usePressedCodes()
  return (
    <div className="glass-strong flex gap-2 rounded-[24px] p-3.5">
      {Array.from({ length: 9 }, (_, i) => {
        const n = i + 1
        const down = pressed.has(`Digit${n}`) || pressed.has(`Numpad${n}`)
        const tone =
          wrong === n
            ? 'bg-coral-100 text-coral-900 shadow-[inset_0_0_0_2px_var(--color-coral-600)]'
            : glow === n
              ? 'bg-accent-strong text-white key-glow'
              : 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-ink-200),0_1px_2px_rgb(27_34_64/0.08)] hover:bg-ink-50'
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n}`}
            onClick={() => onPick(n)}
            className={`grid size-16 cursor-pointer place-items-center rounded-[14px] font-body text-4xl transition-[transform,background-color] duration-100 ${down ? 'scale-95' : ''} ${tone}`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
