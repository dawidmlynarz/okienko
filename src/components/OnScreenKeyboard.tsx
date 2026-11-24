import { useMemo } from 'react'
import { POLISH_LETTERS, detectPlatform, glowCodes, keyboardRows, type Platform } from '../keyboard/polish'
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

export function OnScreenKeyboard({ target, hint = true, wrongCode, platform = detectPlatform(), compact = false }: Props) {
  const rows = useMemo(() => keyboardRows(platform), [platform])
  const pressed = usePressedCodes()
  const glow = new Set(target && hint ? glowCodes(target, platform) : [])
  const altNeeded = target ? glowCodes(target, platform).some((c) => c.startsWith('Alt')) : false
  const unit = compact ? 52 : 64
  const gap = compact ? 6 : 8

  return (
    <div
      className="inline-flex flex-col rounded-xl bg-surface p-4 shadow-card"
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
            const tone = isWrong
              ? 'bg-coral-200 text-coral-900 [--edge:var(--color-coral-600)]'
              : isGlow
                ? 'bg-accent-pastel text-accent-deep [--edge:var(--accent-edge)] key-glow'
                : 'bg-ink-50 text-ink [--edge:var(--color-ink-300)]'
            return (
              <div
                key={k.code}
                className={`pressable relative grid place-items-center rounded-md font-body ${tone}`}
                data-pressed={isDown}
                style={{ width: w, height: unit, fontSize: k.label.length > 1 ? unit * 0.26 : unit * 0.46, cursor: 'default' }}
              >
                <span className="leading-none">{k.label}</span>
                {pl && altNeeded && (
                  <span className={`absolute right-1.5 bottom-1 leading-none ${isGlow ? 'text-accent-deep' : 'text-muted'}`} style={{ fontSize: unit * 0.24 }}>
                    {pl}
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
