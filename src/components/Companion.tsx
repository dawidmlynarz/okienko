import { SpeakerHigh } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { speak } from '../lib/speak'
import { useOkienko } from '../store/useOkienko'
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
  className?: string
}

/** Smoczek with a speech bubble. Speaks each new line aloud and moves his mouth while talking. */
export function Companion({ text, say, sayKey, pose = 'idle', size = 220, bubbleSide = 'right', className = '' }: Props) {
  const profile = useOkienko((s) => s.profile)
  const [talking, setTalking] = useState(false)
  const line = say ?? text

  const talk = (t: string) => {
    setTalking(true)
    speak(t, { onEnd: () => setTalking(false) })
    // Safety net: some voices never fire onend.
    window.setTimeout(() => setTalking(false), Math.min(12000, 600 + t.length * 70))
  }

  useEffect(() => {
    if (line) talk(line)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, sayKey])

  const bubble = (
    <AnimatePresence>
      {text && (
        <motion.div
          key={`${text}-${sayKey ?? ''}`}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative flex max-w-md items-start gap-3 rounded-lg bg-surface px-6 py-4 text-2xl leading-snug shadow-card"
          role="status"
        >
          <span className="flex-1">{text}</span>
          <button
            type="button"
            aria-label="Powiedz jeszcze raz"
            title="Powiedz jeszcze raz"
            className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-800 hover:bg-sky-200"
            onClick={() => line && talk(line)}
          >
            <SpeakerHigh size={24} weight="bold" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const dir = bubbleSide === 'top' ? 'flex-col-reverse items-center' : bubbleSide === 'left' ? 'flex-row-reverse items-end' : 'flex-row items-end'
  return (
    <div className={`flex gap-4 ${dir} ${className}`}>
      <Smoczek pose={pose} talking={talking && pose !== 'thinking'} color={profile?.companionColor} size={size} label={profile?.companionName ?? 'Smoczek'} />
      <div className={bubbleSide === 'top' ? '' : 'self-start pt-4'}>{bubble}</div>
    </div>
  )
}
