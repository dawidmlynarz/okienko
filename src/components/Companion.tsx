import { SpeakerHigh } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { speak } from '../lib/speak'
import { useDomek } from '../store/useDomek'
import { Smoczek, type Pose } from './Smoczek'

interface Props {
  /** What the bubble shows. */
  text?: string | null
  /** What the voice says (defaults to text). Changing sayKey re-speaks the same text. */
  say?: string | null
  sayKey?: string | number
  pose?: Pose
  size?: number
  bubbleSide?: 'right' | 'left' | 'top'
  /** 'plain' drops the bubble chrome, for use inside a card. */
  variant?: 'bubble' | 'plain'
  className?: string
  /** A smaller bubble for game screens, so it never runs into the board. */
  narrow?: boolean
}

/** Speak a line whenever it (or its key) changes, and report whether Smoczek is talking. */
export function useTalk(line: string | null | undefined, key?: string | number) {
  const [talking, setTalking] = useState(false)
  const talk = (t: string) => {
    setTalking(true)
    speak(t, { onEnd: () => setTalking(false) })
    // Safety net: some voices never fire onend.
    window.setTimeout(() => setTalking(false), Math.min(12000, 600 + t.length * 70))
  }
  useEffect(() => {
    if (line) talk(line)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, key])
  return { talking, repeat: () => line && talk(line) }
}

/** Smoczek with a speech bubble. Speaks each new line aloud and moves his mouth while talking. */
export function Companion({ text, say, sayKey, pose = 'idle', size = 220, bubbleSide = 'right', variant = 'bubble', className = '', narrow = false }: Props) {
  const profile = useDomek((s) => s.profile)
  const line = say ?? text
  const { talking, repeat } = useTalk(line, sayKey)

  const bubble = (
    <AnimatePresence>
      {text && (
        <motion.div
          key={`${text}-${sayKey ?? ''}`}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className={`relative flex items-start gap-3 leading-snug text-ink ${narrow ? 'max-w-[290px] text-xl' : 'max-w-md text-2xl'} ${variant === 'bubble' ? 'rounded-[22px] bg-surface py-4 pr-4 pl-6 shadow-card' : ''}`}
          role="status"
        >
          <span className="flex-1">{text}</span>
          <button
            type="button"
            aria-label="Powiedz jeszcze raz"
            title="Powiedz jeszcze raz"
            className="grid size-10 shrink-0 place-items-center rounded-full text-sky-700 transition-colors hover:bg-sky-100"
            onClick={repeat}
          >
            <SpeakerHigh size={22} weight="bold" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const dir = bubbleSide === 'top' ? 'flex-col-reverse items-center' : bubbleSide === 'left' ? 'flex-row-reverse items-end' : 'flex-row items-end'
  return (
    <div className={`flex gap-4 ${dir} ${className}`}>
      <Smoczek pose={pose} talking={talking && pose !== 'thinking'} color={profile?.companionColor} size={size} label="Smoczek" />
      <div className={bubbleSide === 'top' || variant === 'plain' ? 'self-center' : 'self-start pt-4'}>{bubble}</div>
    </div>
  )
}
