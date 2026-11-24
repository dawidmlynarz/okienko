import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PictureId } from '../../assets/pictures'
import { Companion } from '../../components/Companion'
import { OnScreenKeyboard } from '../../components/OnScreenKeyboard'
import { Picture } from '../../components/Picture'
import type { Pose } from '../../components/Smoczek'
import data from '../../content/obrazkowe-slowa.json'
import { pl } from '../../i18n/pl'
import { altKeyLabel, chordFor, sameLetter } from '../../keyboard/polish'
import { usePlatform } from '../../keyboard/usePlatform'
import { useTypedKeys } from '../../keyboard/useKeys'
import { burst, celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import type { AppProps } from '../registry'
import { GameHud, GameShell, shuffle, starsFor, type LevelBase, type RoundProps } from '../shared/GameKit'

interface Level extends LevelBase {
  count: number
  hintAfterMs: number
  words: { word: string; picture: string }[]
}
const levels = data.levels as Level[]

export default function ObrazkoweSlowa(_: AppProps) {
  return <GameShell levels={levels} lead={pl.words.lead} hint={pl.parentHint.games['obrazkowe-slowa']} backdrop={<Backdrop />} className="bg-pink-50" Round={Round} />
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute -top-40 -left-24 size-[520px] rounded-full bg-pink-100 blur-3xl" />
      <div className="absolute -right-20 -bottom-48 size-[560px] rounded-full bg-lavender-100 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-pink-200)_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-60" />
    </div>
  )
}

function Round({ level, onDone, onBack }: RoundProps<Level>) {
  const platform = usePlatform()
  const words = useMemo(() => shuffle(level.words).slice(0, level.count), [level])
  const [wi, setWi] = useState(0)
  const [typed, setTyped] = useState(0)
  const [hint, setHint] = useState(level.hintAfterMs === 0)
  const [missed, setMissed] = useState(false)
  const [solved, setSolved] = useState(false)
  const [wrongCode, setWrongCode] = useState<string | null>(null)
  const [shake, setShake] = useState(0)
  const [talk, setTalk] = useState<{ text: string | null; say?: string; pose: Pose; key: number }>({ text: null, pose: 'happy', key: 0 })
  const good = useRef(0)
  const total = useMemo(() => words.reduce((n, w) => n + [...w.word].length, 0), [words])
  const tell = useCallback((text: string | null, pose: Pose, say?: string) => setTalk((c) => ({ text, pose, say, key: c.key + 1 })), [])

  const current = words[wi]
  const letters = current ? [...current.word] : []
  const target = !solved && current ? letters[typed] : null

  // A new word: say it, then let her type.
  useEffect(() => {
    if (!current) return
    setTyped(0)
    setSolved(false)
    setMissed(false)
    setHint(level.hintAfterMs === 0)
    tell(current.word.toLocaleUpperCase('pl'), 'happy', pl.words.say(current.word))
  }, [current, level.hintAfterMs, tell])

  useEffect(() => {
    if (hint || !target) return
    const t = window.setTimeout(() => setHint(true), level.hintAfterMs)
    return () => window.clearTimeout(t)
  }, [hint, target, typed, level.hintAfterMs])

  /** On screen only the keys (option + A); the full sentence is spoken. */
  const keys = (c: string) => {
    const ch = chordFor(c)
    if (ch?.alt) return pl.game.keysAlt(altKeyLabel(platform), ch.code.slice(3))
    return c.toUpperCase()
  }
  const instruction = (c: string) => {
    const ch = chordFor(c)
    if (ch?.alt) return pl.game.pressAlt(altKeyLabel(platform), ch.code.slice(3))
    return pl.game.pressKey(c.toUpperCase())
  }

  useTypedKeys((k, e) => {
    if (k.kind === 'escape') return onBack()
    if (!target || k.kind !== 'char') return
    if (sameLetter(k.char, target)) {
      if (!missed) good.current += 1
      setMissed(false)
      setHint(level.hintAfterMs === 0)
      play('key')
      const next = typed + 1
      setTyped(next)
      if (next < letters.length) return
      // Whole word done.
      setSolved(true)
      play('correct')
      burst(0.5, 0.35)
      const last = wi + 1 >= words.length
      tell(pl.game.good[wi % pl.game.good.length], last ? 'cheer' : 'happy', pl.words.good(current.word))
      window.setTimeout(() => {
        if (last) {
          play('fanfare')
          celebrate()
          window.setTimeout(() => onDone(starsFor(good.current, total), `${good.current} / ${total}`), 700)
        } else setWi((i) => i + 1)
      }, 1500)
    } else {
      play('wrong')
      setMissed(true)
      setHint(true)
      setShake((s) => s + 1)
      setWrongCode(e.code)
      window.setTimeout(() => setWrongCode(null), 350)
      tell(keys(target), 'thinking', instruction(target))
    }
  })

  if (!current) return null
  return (
    <div className="flex h-full flex-col">
      <GameHud onBack={onBack} done={wi + (solved ? 1 : 0)} total={words.length} title={level.title} />

      <div className="relative flex min-h-0 flex-1 items-center justify-center gap-10 px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={wi}
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={solved ? { scale: [1, 1.12, 1], rotate: [0, 6, 0], opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="grid aspect-square h-[min(240px,30vh)] shrink-0 place-items-center rounded-[40px] bg-surface shadow-float ring-1 ring-ink-900/5"
          >
            <Picture id={current.picture as PictureId} size="68%" />
          </motion.div>
        </AnimatePresence>

        <motion.div key={shake} animate={shake ? { x: [0, -10, 9, -6, 4, 0] } : {}} transition={{ duration: 0.4 }} className="flex gap-3" aria-label={current.word}>
          {letters.map((c, i) => {
            const done = i < typed
            const now = i === typed && !solved
            return (
              <motion.span
                key={`${wi}-${i}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={`relative grid h-[min(112px,14vh)] w-[min(92px,11.5vh)] place-items-center rounded-[24px] font-body text-[min(64px,8vh)] leading-none ${
                  solved ? 'bg-mint-100 text-mint-900 ring-2 ring-mint-400' : done ? 'bg-surface text-ink shadow-card' : now ? 'bg-surface text-ink-300 ring-4 ring-accent-pastel' : 'bg-white/60 text-ink-300 ring-1 ring-ink-200'
                }`}
              >
                {done || solved ? c.toLocaleUpperCase('pl') : now && hint ? c.toLocaleUpperCase('pl') : ''}
                {now && <span className="cursor-blink absolute bottom-2.5 h-1.5 w-10 rounded-full bg-accent-strong" />}
              </motion.span>
            )
          })}
        </motion.div>

        <div className="absolute bottom-2 left-6 z-10">
          <Companion text={talk.text} say={talk.say} sayKey={talk.key} pose={talk.pose} size={130} narrow />
        </div>
      </div>

      <div className="relative z-10 flex justify-center pb-5">
        <OnScreenKeyboard target={target} hint={hint} wrongCode={wrongCode} platform={platform} compact />
      </div>
    </div>
  )
}
