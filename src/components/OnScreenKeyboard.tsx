import { useMemo } from 'react'
import { POLISH_LETTERS, glowCodes, keyboardRows, type Platform } from '../keyboard/polish'
import { usePlatform } from '../keyboard/usePlatform'
import { usePressedCodes } from '../keyboard/useKeys'

interface Props {
  /** The character she should type next. Its key (and Shift / Alt) glows. */
  target?: string | null
  /** Show the glow. Turn off to let her find the key alone first. */
  hint?: boolean
  /** Flash this code in coral briefly after a wrong key. */
  wrongCode?: string | null
  platform?: Platform
  compact?: boolean
}

const PL_BY_CODE: Record<string, string> = Object.fromEntries(Object.entries(POLISH_LETTERS).map(([b, p]) => [`Key${b.toUpperCase()}`, p]))

export function OnScreenKeyboard({ target, hint = true, wrongCode, platform: forced, compact = false }: Props) {
  const detected = usePlatform()
  const platform = forced ?? detected
  const rows = useMemo(() => keyboardRows(platform), [platform])
  const pressed = usePressedCodes()
  const glow = new Set(target && hint ? glowCodes(target, platform) : [])
  const altNeeded = target ? glowCodes(target, platform).some((c) => c.startsWith('Alt')) : false
  const unit = compact ? 52 : 64
  const gap = compact ? 6 : 8

  return (
    <div
      className="glass-strong inline-flex flex-col rounded-[24px] p-3.5"
      style={{ gap }}
      aria-hidden
    >
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center" style={{ gap, paddingLeft: i === 1 ? unit * 0.3 : 0 }}>
          {row.map((k) => {
            const isGlow = glow.has(k.code)
            const isDown = pressed.has(k.code)
            const isWrong = wrongCode === k.code
            const pl = PL_BY_CODE[k.code]
            const w = (k.width ?? 1) * unit + ((k.width ?? 1) - 1) * gap
            // Glowing key: strong accent with a white letter (5.3:1+). Others: white caps with a hairline.
            const tone = isWrong
              ? 'bg-coral-100 text-coral-900 shadow-[inset_0_0_0_2px_var(--color-coral-600)]'
              : isGlow
                ? 'bg-accent-strong text-white key-glow'
                : isDown
                  ? 'bg-ink-100 text-ink shadow-[inset_0_0_0_1px_var(--color-ink-200)]'
                  : 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-ink-200),0_1px_2px_rgb(27_34_64/0.08)]'
            return (
              <div
                key={k.code}
                className={`relative grid place-items-center rounded-[12px] font-body transition-[transform,background-color] duration-100 ${isDown ? 'scale-95' : ''} ${tone}`}
                style={{ width: w, height: unit, fontSize: k.label.length > 1 ? unit * 0.24 : unit * 0.42, cursor: 'default' }}
              >
                {k.label.length > 1 || k.symbol ? (
                  // Modifier keys: symbol above the word, like the real keycap.
                  <span className="flex flex-col items-center gap-0.5 leading-none font-medium">
                    {k.symbol && <span style={{ fontSize: k.label ? unit * 0.28 : unit * 0.4 }}>{k.symbol}</span>}
                    {k.label && <span>{k.label}</span>}
                  </span>
                ) : (
                  <span className="leading-none font-medium">{k.label}</span>
                )}
                {pl && altNeeded && (
                  <span className={`absolute right-1.5 bottom-1 leading-none ${isGlow ? 'text-white' : 'text-muted'}`} style={{ fontSize: unit * 0.24 }}>
                    {pl.toUpperCase()}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
