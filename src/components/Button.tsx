import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { play } from '../lib/sound'

type Variant = 'pastel' | 'strong' | 'plain' | 'ghost'
type Size = 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  children?: ReactNode
}

// Pairs from the token rules: soft 100 fill + 900 label; strong 700 fill + white label (5.3:1+).
const variants: Record<Variant, string> = {
  pastel: 'bg-accent-soft text-accent-deep hover:bg-accent-pastel',
  strong: 'bg-accent-strong text-white shadow-button hover:brightness-110',
  plain: 'bg-surface text-ink shadow-button hover:bg-ink-50',
  ghost: 'bg-transparent text-accent-strong hover:bg-accent-soft',
}

const sizes: Record<Size, string> = {
  md: 'h-14 px-6 text-xl gap-2.5 rounded-md',
  lg: 'h-16 px-8 text-2xl gap-3 rounded-lg',
}

export function Button({ variant = 'pastel', size = 'md', icon, children, className = '', onClick, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        play('click')
        onClick?.(e)
      }}
      className={`pressable inline-flex shrink-0 items-center justify-center font-display font-semibold whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}

/** Round icon button for title bars and the top bar (48px target). */
export function IconButton({ label, children, className = '', onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      onClick={(e) => {
        play('click')
        onClick?.(e)
      }}
      className={`pressable grid size-12 place-items-center rounded-full text-ink hover:bg-ink-900/6 ${className}`}
    >
      {children}
    </button>
  )
}
