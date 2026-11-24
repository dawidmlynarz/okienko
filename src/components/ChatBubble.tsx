import { SpeakerSimpleHigh } from '@phosphor-icons/react'
import { motion } from 'motion/react'

/**
 * What Smoczek says: a small chat bubble with a tail pointing at him.
 * Short text only; the full sentence is spoken. The tiny speaker repeats it.
 */
export function ChatBubble({
  text,
  onRepeat,
  tail = 'left',
  size = 'md',
  bubbleKey,
}: {
  text: string
  onRepeat?: () => void
  /** Which side Smoczek is on. */
  tail?: 'left' | 'bottom' | 'top'
  size?: 'sm' | 'md' | 'lg'
  bubbleKey?: string | number
}) {
  const type = size === 'lg' ? 'text-[min(32px,3.8vh)]' : size === 'sm' ? 'text-xl' : 'text-2xl'
  const corner = tail === 'left' ? 'rounded-bl-[6px]' : tail === 'bottom' ? 'rounded-b-[24px]' : ''
  return (
    <motion.div
      key={bubbleKey}
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 460, damping: 26 }}
      style={{ transformOrigin: tail === 'left' ? '0% 100%' : '50% 100%' }}
      className={`relative inline-flex max-w-full items-center gap-2 rounded-[24px] bg-surface py-3 pr-3 pl-5 text-ink shadow-[0_0_0_1px_rgb(27_34_64/0.05),0_6px_20px_-6px_rgb(27_34_64/0.18)] ${corner}`}
      role="status"
    >
      <span className={`font-body leading-snug ${type}`}>{text}</span>
      {onRepeat && (
        <button
          type="button"
          aria-label="Powiedz jeszcze raz"
          title="Powiedz jeszcze raz"
          onClick={onRepeat}
          className="grid size-8 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
        >
          <SpeakerSimpleHigh size={18} weight="fill" />
        </button>
      )}
      {tail === 'bottom' && <span className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-surface" aria-hidden />}
      {tail === 'top' && <span className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-surface" aria-hidden />}
    </motion.div>
  )
}
