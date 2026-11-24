import { Check, LockKey, UserCircle, Wrench } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type CSSProperties } from 'react'
import type { PictureId } from '../assets/pictures'
import { Companion } from '../components/Companion'
import { OnScreenKeyboard } from '../components/OnScreenKeyboard'
import { Picture } from '../components/Picture'
import type { Pose } from '../components/Smoczek'
import { pl } from '../i18n/pl'
import { chordFor, sameLetter } from '../keyboard/polish'
import { useTypedKeys } from '../keyboard/useKeys'
import { burst } from '../lib/confetti'
import { play, unlockAudio } from '../lib/sound'
import { letterName } from '../lib/speak'
import { useOkienko } from '../store/useOkienko'

type Step = 'name' | 'pin'
const PIN_PICTURES: PictureId[] = ['kot', 'pies', 'slonce', 'gwiazda', 'jablko', 'rybka', 'kwiatek', 'rakieta', 'tecza']

export function Login() {
  const profile = useOkienko((s) => s.profile)!
  const [step, setStep] = useState<Step>('name')
  const [line, setLine] = useState<{ text: string; say?: string; pose: Pose; key: number }>(() => ({
    text: pl.login.typeName,
    say: `${pl.login.hello(profile.companionName)} ${pl.login.typeNameSay(profile.childName)}`,
    pose: 'happy',
    key: 0,
  }))
  const tell = (text: string, pose: Pose = 'idle', say?: string) => setLine((l) => ({ text, say, pose, key: l.key + 1 }))

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-6" onPointerDown={unlockAudio}>
      <StepDots step={step} />
      <div className="flex w-full max-w-6xl items-center justify-center gap-8">
        <Companion text={line.text} say={line.say} sayKey={line.key} pose={line.pose} size={210} bubbleSide="top" className="w-80 shrink-0" />
        <motion.div layout className="flex min-w-[680px] flex-col items-center gap-6 rounded-xl bg-surface p-8 shadow-float">
          <AnimatePresence mode="wait">
            {step === 'name' ? (
              <motion.div key="name" exit={{ opacity: 0, x: -40 }} className="flex flex-col items-center gap-6">
                <NameStep
                  name={profile.childName}
                  onTell={tell}
                  onDone={() => {
                    setStep('pin')
                    const has = !!profile.pin
                    tell(has ? pl.login.pinEnter : pl.login.pinChoose, 'happy', `${pl.login.welcome(profile.childName)} ${has ? pl.login.pinEnterSay : pl.login.pinChooseSay}`)
                  }}
                />
              </motion.div>
            ) : (
              <motion.div key="pin" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-6">
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
    { id: 'name' as const, icon: <UserCircle size={26} weight="bold" />, label: 'Imię' },
    { id: 'pin' as const, icon: <LockKey size={26} weight="bold" />, label: 'Tajne obrazki' },
  ]
  const idx = items.findIndex((i) => i.id === step)
  return (
    <ol className="flex items-center gap-3 rounded-full bg-surface/90 px-3 py-2 shadow-card" aria-label={pl.login.twoStepTitle}>
      {items.map((it, i) => (
        <li key={it.id} className="flex items-center gap-3">
          {i > 0 && <span className={`h-1 w-10 rounded-full ${i <= idx ? 'bg-sky-600' : 'bg-ink-200'}`} />}
          <span
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-lg font-semibold ${
              i === idx ? 'bg-sky-700 text-white' : i < idx ? 'bg-sky-100 text-sky-900' : 'text-muted'
            }`}
          >
            {i < idx ? <Check size={24} weight="bold" /> : it.icon}
            {it.label}
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
          onTell(pl.login.welcome(name), 'cheer')
          window.setTimeout(onDone, 1600)
        } else if (pos === 0) {
          onTell(pl.game.correct[1], 'happy', '')
        }
      } else {
        play('wrong')
        setShake((s) => s + 1)
        setWrongCode(e.code)
        window.setTimeout(() => setWrongCode(null), 350)
        const m = misses + 1
        setMisses(m)
        if (m >= 2) onTell(`Szukaj litery ${target.toUpperCase()}`, 'thinking', `Szukaj litery ${letterName(target)}. Świeci się na klawiaturze.`)
      }
    },
    !done,
  )

  const needsShift = !!target && target !== target.toLowerCase() && !!chordFor(target)?.shift

  return (
    <>
      <h2 className="font-display text-3xl font-semibold">{pl.login.typeName}</h2>
      <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.35 }} className="flex gap-3">
        {letters.map((c, i) => {
          const filled = i < pos
          const current = i === pos
          return (
            <span
              key={i}
              className={`grid h-24 w-20 place-items-center rounded-lg border-4 font-body text-6xl ${
                filled ? 'border-mint-600 bg-mint-100 text-mint-900' : current ? 'border-sky-600 bg-sky-50 text-ink-400' : 'border-ink-200 bg-ink-50 text-ink-300'
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
      <p className="h-7 text-lg text-muted">{needsShift ? pl.login.capitalHint : ''}</p>
      <OnScreenKeyboard target={target} wrongCode={wrongCode} compact />
    </>
  )
}

function PinStep({ onTell }: { onTell: (t: string, p?: Pose, say?: string) => void }) {
  const { profile, setPin, login } = useOkienko()
  const saved = profile?.pin ?? null
  const [mode] = useState<'enter' | 'choose'>(saved ? 'enter' : 'choose')
  const [first, setFirst] = useState<PictureId[] | null>(null)
  const [picks, setPicks] = useState<PictureId[]>([])
  const [shake, setShake] = useState(0)
  const [busy, setBusy] = useState(false)

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
        onTell(pl.login.pinRepeat, 'happy', pl.login.pinRepeatSay)
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
    onTell(pl.login.welcome(profile!.childName), 'cheer')
    window.setTimeout(login, 1500)
  }
  function fail(text: string, say: string) {
    play('wrong')
    setShake((s) => s + 1)
    onTell(text, 'thinking', say)
    window.setTimeout(() => {
      setPicks([])
      setBusy(false)
    }, 500)
  }

  const title = mode === 'enter' ? pl.login.pinEnter : first ? pl.login.pinRepeat : pl.login.pinChoose

  return (
    <>
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.35 }} className="flex gap-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`grid size-24 place-items-center rounded-lg border-4 ${picks[i] ? 'border-sky-600 bg-sky-50' : 'border-dashed border-ink-300 bg-ink-50'}`}>
            {picks[i] &&
              (mode === 'enter' ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="size-8 rounded-full bg-sky-700" aria-label="ukryty obrazek" />
              ) : (
                <motion.span initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                  <Picture id={picks[i]} size={64} />
                </motion.span>
              ))}
          </span>
        ))}
      </motion.div>
      <div className="grid grid-cols-3 gap-4">
        {PIN_PICTURES.map((id) => (
          <button
            key={id}
            type="button"
            disabled={busy}
            aria-label={pl.pictures[id as keyof typeof pl.pictures]}
            onClick={() => {
              if (picks.length >= 3) return
              play('pop')
              setPicks((p) => [...p, id])
            }}
            style={{ '--edge': 'var(--color-ink-300)' } as CSSProperties}
            className="pressable grid size-28 place-items-center rounded-lg border-2 border-ink-200 bg-surface hover:bg-sky-50"
          >
            <Picture id={id} size={72} />
          </button>
        ))}
      </div>
      <div className="flex w-full items-center justify-between text-lg text-muted">
        <span>{mode === 'enter' ? pl.login.pinSecret : pl.login.twoStepWhy}</span>
        <button type="button" className="rounded-md px-3 py-1 font-display font-semibold text-sky-700 hover:bg-sky-50" onClick={() => setPicks([])}>
          {pl.login.clear}
        </button>
      </div>
    </>
  )
}

export function ParentButton() {
  const setParentOpen = useOkienko((s) => s.setParentOpen)
  return (
    <button
      type="button"
      onClick={() => setParentOpen(true)}
      className="absolute right-5 bottom-5 z-20 flex items-center gap-2 rounded-full bg-surface/80 px-4 py-2 text-base text-muted shadow-card hover:bg-surface"
    >
      <Wrench size={20} weight="bold" /> {pl.login.parent}
    </button>
  )
}
