import { useEffect, useRef, useState } from 'react'
import { readKey, type TypedKey } from './polish'

/** Listen to the physical keyboard and get Okienko-level keys (letters incl. Polish, backspace, enter). */
export function useTypedKeys(handler: (k: TypedKey, e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      // Text fields (parent forms, Notatnik) get native typing.
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const k = readKey({
        key: e.key,
        code: e.code,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        repeat: e.repeat,
        isComposing: e.isComposing,
        altGraph: e.getModifierState?.('AltGraph'),
      })
      if (!k || e.repeat) return
      // Keep Space from scrolling and Option/AltGr from triggering browser menus.
      e.preventDefault()
      ref.current(k, e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

/** Which physical keys are held right now, by KeyboardEvent.code. Drives the on-screen keyboard. */
export function usePressedCodes(): Set<string> {
  const [codes, setCodes] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    const down = (e: KeyboardEvent) => setCodes((s) => (s.has(e.code) ? s : new Set(s).add(e.code)))
    const up = (e: KeyboardEvent) =>
      setCodes((s) => {
        if (!s.has(e.code)) return s
        const n = new Set(s)
        n.delete(e.code)
        return n
      })
    const clear = () => setCodes(new Set())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
  return codes
}
