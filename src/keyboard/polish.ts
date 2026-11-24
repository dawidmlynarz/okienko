/**
 * Polish keyboard module.
 *
 * Okienko runs in Chrome on a MacBook (macOS "Polish Pro" layout: Option + letter)
 * or a Windows PC ("Polish (Programmers)" layout: right Alt, i.e. AltGr + letter).
 * Both layouts report the produced letter in KeyboardEvent.key, so `key` is the
 * source of truth. `code` is only used to (a) draw the on-screen keyboard and
 * (b) rescue the case where the Mac is accidentally on a non-Polish layout and
 * Option + A produces "å" instead of "ą".
 */

export type Platform = 'mac' | 'win'

/** The subset of KeyboardEvent we read. Keeps the module testable without a DOM. */
export interface KeyLike {
  key: string
  code: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  repeat?: boolean
  isComposing?: boolean
  /** Result of event.getModifierState('AltGraph') when available. */
  altGraph?: boolean
}

export type TypedKey =
  | { kind: 'char'; char: string }
  | { kind: 'backspace' }
  | { kind: 'enter' }
  | { kind: 'escape' }

/** Base letter (physical key) → Polish letter produced with Option / AltGr. */
export const POLISH_LETTERS: Record<string, string> = {
  a: 'ą',
  c: 'ć',
  e: 'ę',
  l: 'ł',
  n: 'ń',
  o: 'ó',
  s: 'ś',
  x: 'ź',
  z: 'ż',
}

const POLISH_TO_BASE: Record<string, string> = Object.fromEntries(
  Object.entries(POLISH_LETTERS).map(([base, pl]) => [pl, base]),
)

export const ALL_POLISH_LETTERS = Object.values(POLISH_LETTERS).flatMap((c) => [c, c.toUpperCase()])

export function isPolishLetter(char: string): boolean {
  return char.toLowerCase() in POLISH_TO_BASE
}

export function detectPlatform(nav: { platform?: string; userAgent?: string } = globalThis.navigator ?? {}): Platform {
  const s = `${nav.platform ?? ''} ${nav.userAgent ?? ''}`
  return /Mac|iPhone|iPad/i.test(s) ? 'mac' : 'win'
}

/**
 * Turn a keydown event into something Okienko cares about, or null to ignore it.
 * Shortcuts (Cmd+R, Ctrl+C) return null so the browser keeps them, but AltGr,
 * which Windows reports as Ctrl+Alt, still types letters.
 */
export function readKey(e: KeyLike): TypedKey | null {
  if (e.isComposing) return null
  switch (e.key) {
    case 'Backspace':
      return { kind: 'backspace' }
    case 'Enter':
      return { kind: 'enter' }
    case 'Escape':
      return { kind: 'escape' }
    case ' ':
    case 'Spacebar':
      return { kind: 'char', char: ' ' }
  }
  // Named keys (Shift, Alt, ArrowLeft, F5, Dead, Unidentified…) are longer than one character.
  const char = e.key.normalize('NFC')
  if ([...char].length !== 1) return null

  const altGr = e.altGraph || (e.ctrlKey && e.altKey)
  if (e.metaKey) return null // Cmd shortcut on Mac, Win key on PC
  if (e.ctrlKey && !altGr) return null // Ctrl shortcut

  // Rescue: Option/AltGr held on a non-Polish layout produced some other symbol.
  if ((e.altKey || altGr) && !isPolishLetter(char)) {
    const rescued = polishFromCode(e.code, e.shiftKey)
    if (rescued) return { kind: 'char', char: rescued }
  }
  return { kind: 'char', char }
}

function polishFromCode(code: string, shift: boolean): string | null {
  const m = /^Key([A-Z])$/.exec(code)
  if (!m) return null
  const pl = POLISH_LETTERS[m[1].toLowerCase()]
  if (!pl) return null
  return shift ? pl.toUpperCase() : pl
}

/** How to type a character: which physical key and which modifiers. Drives the glowing keys. */
export interface Chord {
  code: string
  shift: boolean
  alt: boolean
}

const PUNCT_CODES: Record<string, { code: string; shift?: boolean }> = {
  ' ': { code: 'Space' },
  '.': { code: 'Period' },
  ',': { code: 'Comma' },
  '-': { code: 'Minus' },
  '?': { code: 'Slash', shift: true },
  '!': { code: 'Digit1', shift: true },
}

export function chordFor(char: string): Chord | null {
  if (char in PUNCT_CODES) {
    const p = PUNCT_CODES[char]
    return { code: p.code, shift: !!p.shift, alt: false }
  }
  if (/^[0-9]$/.test(char)) return { code: `Digit${char}`, shift: false, alt: false }
  const lower = char.toLowerCase()
  const shift = char !== lower
  const base = POLISH_TO_BASE[lower]
  if (base) return { code: `Key${base.toUpperCase()}`, shift, alt: true }
  if (/^[a-z]$/.test(lower)) return { code: `Key${lower.toUpperCase()}`, shift, alt: false }
  return null
}

/** The modifier key a child must hold for Polish letters, as printed on her keyboard. */
export function altKeyLabel(platform: Platform): string {
  return platform === 'mac' ? 'option' : 'Alt'
}

/** Codes of the Alt keys to glow. Both Option keys work on a Mac; on Windows only the right Alt is AltGr. */
export function altKeyCodes(platform: Platform): string[] {
  return platform === 'mac' ? ['AltLeft', 'AltRight'] : ['AltRight']
}

/** Case-insensitive compare that keeps Polish letters distinct from their base letters. */
export function sameLetter(a: string, b: string): boolean {
  return a.normalize('NFC').toLocaleLowerCase('pl') === b.normalize('NFC').toLocaleLowerCase('pl')
}

/** Physical layout for the on-screen keyboard (ISO-ish, letters only rows matter). */
export interface KeyCap {
  code: string
  label: string
  width?: number
}

export function keyboardRows(platform: Platform): KeyCap[][] {
  const letters = (s: string) => [...s].map((c) => ({ code: `Key${c.toUpperCase()}`, label: c }))
  const alt = platform === 'mac' ? 'option' : 'alt'
  return [
    letters('qwertyuiop'),
    letters('asdfghjkl'),
    [{ code: 'ShiftLeft', label: 'shift', width: 1.6 }, ...letters('zxcvbnm'), { code: 'ShiftRight', label: 'shift', width: 1.6 }],
    platform === 'mac'
      ? [
          { code: 'AltLeft', label: alt, width: 1.5 },
          { code: 'MetaLeft', label: 'cmd', width: 1.5 },
          { code: 'Space', label: '', width: 6 },
          { code: 'MetaRight', label: 'cmd', width: 1.5 },
          { code: 'AltRight', label: alt, width: 1.5 },
        ]
      : [
          { code: 'ControlLeft', label: 'ctrl', width: 1.5 },
          { code: 'AltLeft', label: 'alt', width: 1.5 },
          { code: 'Space', label: '', width: 6 },
          { code: 'AltRight', label: 'alt gr', width: 1.5 },
          { code: 'ControlRight', label: 'ctrl', width: 1.5 },
        ],
  ]
}

/** Codes to glow for a target character, including Shift and the Alt key when needed. */
export function glowCodes(char: string, platform: Platform): string[] {
  const chord = chordFor(char)
  if (!chord) return []
  const codes = [chord.code]
  if (chord.alt) codes.push(...altKeyCodes(platform))
  if (chord.shift) {
    // Teach opposite-hand Shift: letters on the left half use right Shift.
    const leftHand = /^Key[QWERTASDFGZXCVB]$/.test(chord.code)
    codes.push(leftHand ? 'ShiftRight' : 'ShiftLeft')
  }
  return codes
}
