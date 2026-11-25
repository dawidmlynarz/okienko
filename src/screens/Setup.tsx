import { ArrowLeft, ArrowRight, Backspace, Play } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ChatBubble } from '../components/ChatBubble'
import { useTalk } from '../components/Companion'
import { OnScreenKeyboard } from '../components/OnScreenKeyboard'
import { colorsFor, friendColors, NATURAL, Smoczek, type Pose } from '../components/Smoczek'
import { pl } from '../i18n/pl'
import { useTypedKeys } from '../keyboard/useKeys'
import { burst } from '../lib/confetti'
import { play, unlockAudio } from '../lib/sound'
import { requestPersistentStorage } from '../store/storage'
import { FRIEND, SPECIES, type Species } from '../companion/species'
import { useDomek, type CompanionColor } from '../store/useDomek'
import { BackupButtons } from './Parent'

/** The friend in each of its five colours. Big pictures, so a child picks by looking. */
export function ColorPicker({ species, value, onChange, size = 60 }: { species: Species; value: CompanionColor; onChange: (c: CompanionColor) => void; size?: number }) {
  return (
    <div role="radiogroup" aria-label={pl.setup.companionColor} className="flex flex-wrap gap-3">
      {colorsFor(species).map((c) => {
        const on = value === c
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={pl.setup.colors[c]}
            title={pl.setup.colors[c]}
            onClick={() => onChange(c)}
            className={`pressable grid place-items-center rounded-[22px] p-2 transition-shadow ${on ? 'bg-accent-soft shadow-[inset_0_0_0_3px_var(--accent-edge)]' : 'bg-surface shadow-[inset_0_0_0_1.5px_var(--color-ink-200)] hover:bg-ink-50'}`}
            style={{ ['--swatch' as string]: friendColors(species, c)[0] }}
          >
            <Smoczek species={species} color={c} outfit={[]} pose={on ? 'happy' : 'idle'} size={size} followEyes={false} />
          </button>
        )
      })}
    </div>
  )
}

/** Four friends to choose from, drawn as they will look. Big cards, so a child can pick. */
export function FriendPicker({ value, onChange, size = 96 }: { value: Species; onChange: (s: Species) => void; size?: number }) {
  return (
    <div role="radiogroup" aria-label={pl.setup.friend} className="grid grid-cols-4 gap-3">
      {SPECIES.map((s) => {
        const on = value === s
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(s)}
            className={`pressable flex flex-col items-center gap-1 rounded-[22px] px-2 pt-2 pb-3 font-display text-lg font-bold transition-shadow ${
              on ? 'bg-accent-soft text-accent-deep shadow-[inset_0_0_0_3px_var(--accent-edge)]' : 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink-200)] hover:bg-ink-50'
            }`}
          >
            <Smoczek species={s} color={NATURAL[s]} pose={on ? 'happy' : 'idle'} outfit={[]} size={size} followEyes={false} />
            {FRIEND[s].name}
          </button>
        )
      })}
    </div>
  )
}

export function Field({ label, hint, value, onChange, id }: { label: string; hint?: string; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="font-display text-lg font-semibold">{label}</span>
      <input
        id={id}
        value={value}
        maxLength={12}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 rounded-[14px] border-2 border-ink-200 bg-surface px-4 text-2xl outline-none transition-shadow focus:border-sky-600 focus:shadow-[0_0_0_4px_var(--color-sky-100)]"
        autoComplete="off"
        spellCheck={false}
      />
      {hint && <span className="text-base text-muted">{hint}</span>}
    </label>
  )
}

type Step = 'start' | 'name' | 'friend' | 'color' | 'done'
const ORDER: Step[] = ['start', 'name', 'friend', 'color', 'done']
const NAME_MAX = 10

/**
 * First run, made for the child: her friend greets her and walks her through three steps.
 * Type your name, pick a friend, pick its colour. Everything is said out loud; big targets, few words.
 * The parent bits (restore a backup) stay small in the corner.
 */
export function Setup() {
  const completeSetup = useDomek((s) => s.completeSetup)
  const [step, setStep] = useState<Step>('start')
  const [name, setName] = useState('')
  const [friend, setFriend] = useState<Species>('smok')
  const [color, setColor] = useState<CompanionColor>(NATURAL.smok)
  const [line, setLine] = useState<{ text: string; say?: string; pose: Pose; key: number }>({ text: pl.setup.kid.hello, pose: 'happy', key: 0 })
  const tell = (text: string, pose: Pose = 'happy', say?: string) => setLine((l) => ({ text, say, pose, key: l.key + 1 }))
  // Nothing is spoken before her first tap: browsers only allow sound after one.
  const { talking, repeat } = useTalk(step === 'start' ? null : (line.say ?? line.text), line.key)
  const shown = name ? name[0].toLocaleUpperCase('pl') + name.slice(1) : ''
  const fr = FRIEND[friend]

  const go = (next: Step) => {
    play('click')
    setStep(next)
    if (next === 'name') tell(pl.setup.kid.name, 'happy', pl.setup.kid.nameSay)
    if (next === 'friend') tell(pl.setup.kid.friend, 'happy', pl.setup.kid.friendSay(shown))
    if (next === 'color') tell(pl.setup.kid.color, 'happy', pl.setup.kid.colorSay)
    if (next === 'done') {
      play('fanfare')
      burst(0.3, 0.45)
      tell(pl.setup.kid.done, 'cheer', pl.setup.kid.doneSay(fr.name, shown))
      void requestPersistentStorage()
      window.setTimeout(() => completeSetup({ childName: shown, companionName: fr.name, companionColor: color, companion: friend }), 4200)
    }
  }
  const back = () => go(ORDER[ORDER.indexOf(step) - 1])
  const canNext = step === 'name' ? name.length >= 2 : true
  const next = () => {
    if (!canNext) {
      play('wrong')
      tell(pl.setup.kid.nameShort, 'thinking')
      return
    }
    go(ORDER[ORDER.indexOf(step) + 1])
  }

  useTypedKeys((k) => {
    if (step === 'start' && k.kind === 'enter') {
      unlockAudio()
      go('name')
    } else if (step === 'name') {
      if (k.kind === 'char' && /\p{L}/u.test(k.char) && name.length < NAME_MAX) {
        play('pop')
        setName((n) => n + k.char.toLocaleLowerCase('pl'))
      } else if (k.kind === 'backspace' && name) {
        play('click')
        setName((n) => n.slice(0, -1))
      } else if (k.kind === 'enter') next()
    } else if ((step === 'friend' || step === 'color') && k.kind === 'enter') next()
  })

  const pickFriend = (s: Species) => {
    play('pop')
    setFriend(s)
    setColor(NATURAL[s])
    tell(pl.setup.kid.thisIs(FRIEND[s].name), 'happy')
  }
  const pickColor = (c: CompanionColor) => {
    play('pop')
    setColor(c)
    tell(pl.setup.kid.nice[Math.floor(Math.random() * pl.setup.kid.nice.length)], 'happy')
  }

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6" onPointerDown={unlockAudio}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong relative flex w-full max-w-[1160px] items-stretch gap-8 rounded-[36px] p-8">
        {/* The friend, talking her through it */}
        <div className="flex w-[300px] shrink-0 flex-col items-center justify-center gap-3">
          <div className="flex min-h-[72px] items-end">
            <AnimatePresence mode="popLayout">
              <ChatBubble key={line.key} text={line.text} onRepeat={step === 'start' ? undefined : repeat} tail="bottom" />
            </AnimatePresence>
          </div>
          <Smoczek key={`${friend}-${color}`} species={friend} color={color} pose={line.pose} beat={line.key} talking={talking && line.pose !== 'thinking'} outfit={[]} size="min(280px, 36vh)" />
        </div>

        <div className="flex min-h-[min(520px,62vh)] min-w-0 flex-1 flex-col">
          <Dots step={step} />
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex w-full flex-col items-center gap-6">
                {step === 'start' && (
                  <>
                    <h1 className="text-center font-display text-5xl font-extrabold">{pl.setup.title}</h1>
                    <button
                      type="button"
                      onClick={() => {
                        unlockAudio()
                        go('name')
                      }}
                      className="pressable flex h-24 items-center gap-4 rounded-full bg-accent-strong px-14 font-display text-4xl font-extrabold text-white shadow-button"
                    >
                      <Play size={40} weight="fill" />
                      {pl.setup.kid.start}
                    </button>
                  </>
                )}
                {step === 'name' && (
                  <>
                    <div className="flex min-h-24 items-center gap-2">
                      {Array.from({ length: Math.max(name.length + 1, 3) }, (_, i) => {
                        const ch = shown[i]
                        const current = i === name.length
                        return (
                          <span
                            key={i}
                            className={`grid h-24 w-[72px] place-items-center rounded-[20px] font-body text-6xl ${
                              ch ? 'bg-sky-50 text-ink shadow-[inset_0_0_0_2px_var(--color-sky-200)]' : current ? 'bg-white shadow-[inset_0_0_0_2px_var(--color-sky-600),0_0_0_5px_var(--color-sky-100)]' : 'bg-white/70 shadow-[inset_0_0_0_2px_var(--color-ink-200)]'
                            }`}
                          >
                            {ch ? (
                              <motion.span initial={{ scale: 0.4, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                                {ch}
                              </motion.span>
                            ) : current && name.length < NAME_MAX ? (
                              <span className="cursor-blink text-sky-600">|</span>
                            ) : null}
                          </span>
                        )
                      })}
                      {name && (
                        <button type="button" aria-label={pl.setup.kid.erase} onClick={() => setName((n) => n.slice(0, -1))} className="pressable ml-2 grid size-16 place-items-center rounded-full bg-white text-ink-700 shadow-button">
                          <Backspace size={30} weight="bold" />
                        </button>
                      )}
                    </div>
                    <OnScreenKeyboard target={null} compact />
                  </>
                )}
                {step === 'friend' && <FriendPicker value={friend} onChange={pickFriend} size={150} />}
                {step === 'color' && <ColorPicker species={friend} value={color} onChange={pickColor} size={124} />}
                {step === 'done' && <h1 className="text-center font-display text-5xl font-extrabold">{pl.setup.kid.done}</h1>}
              </motion.div>
            </AnimatePresence>
          </div>

          {step !== 'start' && step !== 'done' && (
            <div className="flex items-center justify-between">
              <button type="button" onClick={back} aria-label={pl.setup.kid.back} className="pressable grid size-16 place-items-center rounded-full bg-white text-ink-700 shadow-button">
                <ArrowLeft size={30} weight="bold" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-disabled={!canNext}
                className={`pressable flex h-20 items-center gap-3 rounded-full px-12 font-display text-3xl font-extrabold shadow-button ${canNext ? 'bg-accent-strong text-white' : 'bg-ink-100 text-ink-500'}`}
              >
                {pl.setup.kid.next}
                <ArrowRight size={32} weight="bold" />
              </button>
            </div>
          )}
        </div>

        {step === 'start' && (
          <div className="absolute right-6 bottom-5">
            <BackupButtons importOnly />
          </div>
        )}
      </motion.div>
    </div>
  )
}

/** Three dots for the three steps, so she can see how far she is. */
function Dots({ step }: { step: Step }) {
  const steps: Step[] = ['name', 'friend', 'color']
  const idx = steps.indexOf(step)
  if (step === 'start') return <div className="h-4" />
  return (
    <div className="flex justify-center gap-3" aria-hidden>
      {steps.map((s, i) => (
        <span key={s} className={`h-4 rounded-full transition-all ${i === idx ? 'w-12 bg-accent-strong' : i < idx || step === 'done' ? 'w-4 bg-accent-strong/60' : 'w-4 bg-ink-200'}`} />
      ))}
    </div>
  )
}
