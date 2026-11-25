import { Check, LockKey, UserCircle, Wrench } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { PictureId } from '../assets/pictures'
import { ChatBubble } from '../components/ChatBubble'
import { useTalk } from '../components/Companion'
import { ParentHint } from '../components/ParentHint'
import { Smoczek } from '../components/Smoczek'
import { OnScreenKeyboard } from '../components/OnScreenKeyboard'
import { Picture } from '../components/Picture'
import type { Pose } from '../components/Smoczek'
import { pl } from '../i18n/pl'
import { sameLetter } from '../keyboard/polish'
import { useTypedKeys } from '../keyboard/useKeys'
import { burst } from '../lib/confetti'
import { play, unlockAudio } from '../lib/sound'
import { letterName } from '../lib/speak'
import { useDomek } from '../store/useDomek'

type Step = 'name' | 'pin'
const PIN_PICTURES: PictureId[] = ['kot', 'pies', 'slonce', 'gwiazda', 'jablko', 'rybka', 'kwiatek', 'rakieta', 'tecza']

export function Login() {
  const profile = useDomek((s) => s.profile)!
  const [step, setStep] = useState<Step>('name')
  const [line, setLine] = useState<{ text: string; say?: string; pose: Pose; key: number }>(() => ({
    text: pl.login.who,
    say: pl.login.whoSay,
    pose: 'happy',
    key: 0,
  }))
  const tell = (text: string, pose: Pose = 'idle', say?: string) => setLine((l) => ({ text, say, pose, key: l.key + 1 }))
  const { talking, repeat } = useTalk(line.say ?? line.text, line.key)

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-4" onPointerDown={unlockAudio}>
      <div className="relative flex flex-col items-center">
        {/* Smoczek as the account picture, overlapping the card like a real login screen */}
        <div className="relative z-10 -mb-20 grid size-44 place-items-center rounded-full bg-white shadow-float ring-8 ring-white/60">
          <Smoczek pose={line.pose} talking={talking && line.pose !== 'thinking'} color={profile.companionColor} size={150} className="translate-y-2" />
        </div>
        <motion.div layout className="glass-strong relative flex w-[860px] flex-col items-center gap-[min(20px,1.6vh)] rounded-[32px] px-10 pt-[min(96px,11vh)] pb-[min(32px,3vh)]">
          <div className="flex min-h-[64px] items-center">
            <AnimatePresence mode="popLayout">
              <ChatBubble key={line.key} text={line.text} onRepeat={repeat} tail="top" />
            </AnimatePresence>
          </div>
          <ParentHint text={pl.login.hint} className="absolute top-5 right-5" />
          <div className="absolute top-5 left-5">
            <StepDots step={step} />
          </div>
          <AnimatePresence mode="wait">
            {step === 'name' ? (
              <motion.div key="name" exit={{ opacity: 0, x: -30 }} className="flex flex-col items-center gap-5">
                <NameStep
                  name={profile.childName}
                  onTell={tell}
                  onDone={() => {
                    setStep('pin')
                    const has = !!profile.pin
                    tell(pl.login.nameDone, 'happy', has ? pl.login.pinEnterSay : pl.login.pinChooseSay)
                  }}
                />
              </motion.div>
            ) : (
              <motion.div key="pin" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-5">
                <PinStep onTell={tell} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function StepDots({ step }: { step: Step }) {
  const items = [
    { id: 'name' as const, icon: <UserCircle size={22} weight="bold" />, label: 'Imię' },
    { id: 'pin' as const, icon: <LockKey size={22} weight="bold" />, label: 'Tajne obrazki' },
  ]
  const idx = items.findIndex((i) => i.id === step)
  return (
    <ol className="flex items-center gap-2 rounded-full bg-ink-50 p-1.5" aria-label={pl.login.twoStepTitle}>
      {items.map((it, i) => (
        <li key={it.id} className="flex items-center gap-3">
          {i > 0 && <span className={`h-0.5 w-6 rounded-full ${i <= idx ? 'bg-sky-600' : 'bg-ink-300'}`} />}
          <span
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-base font-semibold ${
              i === idx ? 'bg-white text-sky-800 shadow-button' : i < idx ? 'text-sky-800' : 'text-muted'
            }`}
          >
            {i < idx ? <Check size={22} weight="bold" /> : it.icon}
            <span className="sr-only">{it.label}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

function NameStep({ name, onTell, onDone }: { name: string; onTell: (t: string, p?: Pose, say?: string) => void; onDone: () => void }) {
  const letters = [...name]
  const [pos, setPos] = useState(0)
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState(0)
  const [wrongCode, setWrongCode] = useState<string | null>(null)
  const done = pos >= letters.length
  const target = done ? null : letters[pos]

  useTypedKeys(
    (k, e) => {
      if (done || k.kind !== 'char' || !target) return
      unlockAudio()
      if (sameLetter(k.char, target)) {
        play('correct')
        setMisses(0)
        setPos((p) => p + 1)
        if (pos + 1 >= letters.length) {
          play('fanfare')
          burst(0.6, 0.45)
          window.setTimeout(onDone, 900)
        } else if (pos === 0 && target !== target.toLowerCase()) {
          onTell(pl.login.nowSmall, 'happy', pl.login.nowSmallSay)
        }
      } else {
        play('wrong')
        setShake((s) => s + 1)
        setWrongCode(e.code)
        window.setTimeout(() => setWrongCode(null), 350)
        const m = misses + 1
        setMisses(m)
        if (m >= 2) onTell(pl.login.seek(target.toUpperCase()), 'thinking', pl.login.seekSay(letterName(target)))
      }
    },
    !done,
  )

  return (
    <>
      <h2 className="font-display text-4xl font-bold">{pl.login.typeName}</h2>
      <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.35 }} className="flex gap-3">
        {letters.map((c, i) => {
          const filled = i < pos
          const current = i === pos
          return (
            <span
              key={i}
              className={`grid h-24 w-20 place-items-center rounded-[20px] font-body text-6xl transition-colors ${
                filled
                  ? 'bg-sky-50 text-ink shadow-[inset_0_0_0_2px_var(--color-sky-200)]'
                  : current
                    ? 'bg-white shadow-[inset_0_0_0_2px_var(--color-sky-600),0_0_0_5px_var(--color-sky-100)]'
                    : 'bg-white/70 shadow-[inset_0_0_0_2px_var(--color-ink-200)]'
              }`}
            >
              {filled ? (
                <motion.span initial={{ scale: 0.4, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                  {c}
                </motion.span>
              ) : current ? (
                <span className="cursor-blink text-sky-600">|</span>
              ) : (
                ''
              )}
            </span>
          )
        })}
      </motion.div>
      <OnScreenKeyboard target={target} wrongCode={wrongCode} compact />
    </>
  )
}

function PinStep({ onTell }: { onTell: (t: string, p?: Pose, say?: string) => void }) {
  const { profile, setPin, login } = useDomek()
  const saved = profile?.pin ?? null
  const [mode] = useState<'enter' | 'choose'>(saved ? 'enter' : 'choose')
  const [first, setFirst] = useState<PictureId[] | null>(null)
  const [picks, setPicks] = useState<PictureId[]>([])
  const [shake, setShake] = useState(0)
  const [busy, setBusy] = useState(false)
  const wrong = useRef(0)

  useEffect(() => {
    if (picks.length < 3 || busy) return
    setBusy(true)
    const t = window.setTimeout(() => {
      if (mode === 'enter') {
        if (saved && picks.every((p, i) => p === saved[i])) succeed()
        else fail(pl.login.pinWrong, pl.login.pinWrongSay)
      } else if (!first) {
        setFirst(picks)
        setPicks([])
        setBusy(false)
        play('correct')
        onTell(pl.login.pinRepeatSay, 'happy')
      } else if (picks.every((p, i) => p === first[i])) {
        setPin(picks)
        succeed()
      } else {
        setFirst(null)
        fail(pl.login.pinMismatch, pl.login.pinMismatchSay)
      }
    }, 450)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks])

  function succeed() {
    play('fanfare')
    burst(0.6, 0.5)
    onTell(pl.login.opening, 'cheer', '')
    window.setTimeout(login, 1200)
  }
  function fail(text: string, say: string) {
    play('wrong')
    setShake((s) => s + 1)
    wrong.current += 1
    if (mode === 'enter' && wrong.current >= 2) onTell(pl.login.pinAskParent, 'thinking', pl.login.pinAskParentSay)
    else onTell(text, 'thinking', say)
    window.setTimeout(() => {
      setPicks([])
      setBusy(false)
    }, 500)
  }

  const title = mode === 'enter' ? pl.login.pinEnter : first ? pl.login.pinRepeat : pl.login.pinChoose

  return (
    <>
      <h2 className="font-display text-4xl font-bold">{title}</h2>
      <div className="relative flex items-center">
      <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.35 }} className="flex gap-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`grid size-[min(96px,10vh)] place-items-center rounded-[22px] ${picks[i] ? 'bg-sky-50 shadow-[inset_0_0_0_2px_var(--color-sky-600)]' : 'bg-white/70 shadow-[inset_0_0_0_2px_var(--color-ink-200)]'}`}>
            {picks[i] &&
              (mode === 'enter' ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="size-8 rounded-full bg-sky-700" aria-label="ukryty obrazek" />
              ) : (
                <motion.span initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                  <Picture id={picks[i]} size="min(64px, 7vh)" />
                </motion.span>
              ))}
          </span>
        ))}
      </motion.div>
      <button type="button" className="absolute left-full ml-4 rounded-full whitespace-nowrap px-4 py-1.5 font-display text-lg font-semibold text-sky-700 hover:bg-sky-50" onClick={() => setPicks([])}>
        {pl.login.clear}
      </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {PIN_PICTURES.map((id) => (
          <button
            key={id}
            type="button"
            disabled={busy}
            aria-label={pl.pictures[id as keyof typeof pl.pictures]}
            onClick={() => {
              if (picks.length >= 3) return
              play('pop')
              const n = picks.length + 1
              if (n < 3) onTell(pl.login.pinOneLeft(3 - n), 'happy', '')
              setPicks((p) => [...p, id])
            }}
            className="pressable grid size-[min(112px,11vh)] place-items-center rounded-[24px] bg-white shadow-button hover:shadow-[0_0_0_3px_var(--color-sky-200),0_8px_20px_rgb(27_34_64/0.1)]"
          >
            <Picture id={id} size="min(72px, 7.5vh)" />
          </button>
        ))}
      </div>
    </>
  )
}

export function ParentButton() {
  const setParentOpen = useDomek((s) => s.setParentOpen)
  return (
    <button
      type="button"
      onClick={() => setParentOpen(true)}
      className="glass absolute right-6 bottom-6 z-20 flex items-center gap-2 rounded-full px-4 py-2 font-display text-base font-semibold text-muted hover:text-ink"
    >
      <Wrench size={20} weight="bold" /> {pl.login.parent}
    </button>
  )
}
