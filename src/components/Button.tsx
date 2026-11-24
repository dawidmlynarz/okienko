import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { play } from '../lib/sound'

type Variant = 'pastel' | 'strong' | 'plain'
type Size = 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  children?: ReactNode
}

// Pairs from the token rules: pastel 300 fill + 900 label + 600 edge; strong 700 fill + white label.
const variants: Record<Variant, { cls: string; edge: string }> = {
  pastel: { cls: 'bg-accent-pastel text-accent-deep', edge: 'var(--accent-edge)' },
  strong: { cls: 'bg-accent-strong text-white', edge: 'var(--accent-deep)' },
  plain: { cls: 'bg-surface text-ink', edge: 'var(--color-ink-300)' },
}

const sizes: Record<Size, string> = {
  md: 'min-h-14 px-6 text-xl gap-2 rounded-md',
  lg: 'min-h-18 px-8 text-2xl gap-3 rounded-lg',
}

export function Button({ variant = 'pastel', size = 'md', icon, children, className = '', onClick, style, ...rest }: Props) {
  const v = variants[variant]
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        play('click')
        onClick?.(e)
      }}
      style={{ '--edge': v.edge, ...style } as CSSProperties}
      className={`pressable inline-flex items-center justify-center font-display font-semibold ${v.cls} ${sizes[size]} ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}

/** Round icon button for title bars and the top bar (44px+ target, 56px default). */
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
      style={{ '--edge': 'var(--color-ink-300)' } as CSSProperties}
      className={`pressable grid size-14 place-items-center rounded-full bg-surface text-ink ${className}`}
    >
      {children}
    </button>
  )
}
