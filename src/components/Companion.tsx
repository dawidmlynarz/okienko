import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { speak } from '../lib/speak'
import { useDomek } from '../store/useDomek'
import { ChatBubble } from './ChatBubble'
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
        <ChatBubble
          key={`${text}-${sayKey ?? ''}`}
          text={text}
          onRepeat={repeat}
          tail={bubbleSide === 'top' ? 'bottom' : 'left'}
          size={narrow ? 'sm' : 'md'}
        />
      )}
    </AnimatePresence>
  )

  const dir = bubbleSide === 'top' ? 'flex-col-reverse items-center' : bubbleSide === 'left' ? 'flex-row-reverse items-end' : 'flex-row items-end'
  return (
    <div className={`flex gap-4 ${dir} ${className}`}>
      <Smoczek pose={pose} talking={talking && pose !== 'thinking'} color={profile?.companionColor} size={size} label="Smoczek" />
      <div className={`${narrow ? 'max-w-[300px]' : 'max-w-md'} ${bubbleSide === 'top' || variant === 'plain' ? 'self-center' : 'self-start pt-4'}`}>{bubble}</div>
    </div>
  )
}
