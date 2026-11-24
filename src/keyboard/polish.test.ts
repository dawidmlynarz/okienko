import { describe, expect, it } from 'vitest'
import {
  ALL_POLISH_LETTERS,
  POLISH_LETTERS,
  chordFor,
  detectPlatform,
  glowCodes,
  readKey,
  sameLetter,
  type KeyLike,
} from './polish'

const ev = (over: Partial<KeyLike>): KeyLike => ({
  key: '',
  code: '',
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...over,
})

const code = (base: string) => `Key${base.toUpperCase()}`

/** What Chrome reports on macOS with the "Polish Pro" layout: Option (+ Shift) + letter. */
const macPolishPro = (base: string, shift = false) => {
  const pl = POLISH_LETTERS[base]
  return ev({ key: shift ? pl.toUpperCase() : pl, code: code(base), altKey: true, shiftKey: shift })
}

/** What Chrome reports on Windows "Polish (Programmers)": right Alt arrives as Ctrl + Alt + AltGraph. */
const winProgrammers = (base: string, shift = false) => {
  const pl = POLISH_LETTERS[base]
  return ev({ key: shift ? pl.toUpperCase() : pl, code: code(base), altKey: true, ctrlKey: true, altGraph: true, shiftKey: shift })
}

describe('Polish letters', () => {
  it('covers all nine Polish letters in both cases', () => {
    expect(ALL_POLISH_LETTERS.sort()).toEqual(['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż', 'Ą', 'Ć', 'Ę', 'Ł', 'Ń', 'Ó', 'Ś', 'Ź', 'Ż'].sort())
  })

  for (const [base, pl] of Object.entries(POLISH_LETTERS)) {
    describe(`${pl} / ${pl.toUpperCase()}`, () => {
      it(`macOS Polish Pro: Option + ${base}`, () => {
        expect(readKey(macPolishPro(base))).toEqual({ kind: 'char', char: pl })
        expect(readKey(macPolishPro(base, true))).toEqual({ kind: 'char', char: pl.toUpperCase() })
      })

      it(`Windows Polish programmer's: right Alt + ${base}`, () => {
        expect(readKey(winProgrammers(base))).toEqual({ kind: 'char', char: pl })
        expect(readKey(winProgrammers(base, true))).toEqual({ kind: 'char', char: pl.toUpperCase() })
      })

      it('Windows AltGr without the AltGraph flag (Ctrl + Alt only)', () => {
        const e = winProgrammers(base)
        delete e.altGraph
        expect(readKey(e)).toEqual({ kind: 'char', char: pl })
      })

      it('decomposed input is normalised to one character', () => {
        const nfd = pl.normalize('NFD')
        expect(readKey(ev({ key: nfd, code: code(base), altKey: true }))).toEqual({ kind: 'char', char: pl })
      })

      it('chord: base key + Alt, + Shift for capitals', () => {
        expect(chordFor(pl)).toEqual({ code: code(base), shift: false, alt: true })
        expect(chordFor(pl.toUpperCase())).toEqual({ code: code(base), shift: true, alt: true })
      })
    })
  }

  it('rescues a Mac on a non-Polish layout (Option + A gives å)', () => {
    expect(readKey(ev({ key: 'å', code: 'KeyA', altKey: true }))).toEqual({ kind: 'char', char: 'ą' })
    expect(readKey(ev({ key: 'Ω', code: 'KeyZ', altKey: true }))).toEqual({ kind: 'char', char: 'ż' })
    expect(readKey(ev({ key: 'Å', code: 'KeyA', altKey: true, shiftKey: true }))).toEqual({ kind: 'char', char: 'Ą' })
  })

  it('does not invent Polish letters for keys that have none', () => {
    expect(readKey(ev({ key: '∂', code: 'KeyD', altKey: true }))).toEqual({ kind: 'char', char: '∂' })
  })

  it('keeps base and Polish letters distinct when comparing', () => {
    expect(sameLetter('a', 'ą')).toBe(false)
    expect(sameLetter('Ł', 'ł')).toBe(true)
    expect(sameLetter('Z', 'z')).toBe(true)
  })
})

describe('plain keys and shortcuts', () => {
  it('reads plain letters, capitals, space and editing keys', () => {
    expect(readKey(ev({ key: 'k', code: 'KeyK' }))).toEqual({ kind: 'char', char: 'k' })
    expect(readKey(ev({ key: 'K', code: 'KeyK', shiftKey: true }))).toEqual({ kind: 'char', char: 'K' })
    expect(readKey(ev({ key: ' ', code: 'Space' }))).toEqual({ kind: 'char', char: ' ' })
    expect(readKey(ev({ key: 'Backspace', code: 'Backspace' }))).toEqual({ kind: 'backspace' })
    expect(readKey(ev({ key: 'Enter', code: 'Enter' }))).toEqual({ kind: 'enter' })
  })

  it('ignores modifiers, dead keys and named keys', () => {
    for (const key of ['Shift', 'Alt', 'AltGraph', 'Control', 'Meta', 'Dead', 'CapsLock', 'ArrowLeft', 'F5', 'Tab', 'Unidentified']) {
      expect(readKey(ev({ key }))).toBeNull()
    }
  })

  it('leaves browser shortcuts alone', () => {
    expect(readKey(ev({ key: 'r', code: 'KeyR', metaKey: true }))).toBeNull() // Cmd+R
    expect(readKey(ev({ key: 'c', code: 'KeyC', ctrlKey: true }))).toBeNull() // Ctrl+C
  })

  it('ignores IME composition', () => {
    expect(readKey(ev({ key: 'a', code: 'KeyA', isComposing: true }))).toBeNull()
  })
})

describe('on-screen keyboard hints', () => {
  it('detects the platform', () => {
    expect(detectPlatform({ platform: 'MacIntel' })).toBe('mac')
    expect(detectPlatform({ platform: 'Win32' })).toBe('win')
  })

  it('glows right Alt only on Windows, both Option keys on Mac', () => {
    expect(glowCodes('ą', 'win')).toEqual(['KeyA', 'AltRight'])
    expect(glowCodes('ą', 'mac')).toEqual(['KeyA', 'AltLeft', 'AltRight'])
  })

  it('glows the opposite-hand Shift for capitals', () => {
    expect(glowCodes('Z', 'mac')).toEqual(['KeyZ', 'ShiftRight'])
    expect(glowCodes('K', 'win')).toEqual(['KeyK', 'ShiftLeft'])
    expect(glowCodes('Ł', 'win')).toEqual(['KeyL', 'AltRight', 'ShiftLeft'])
  })

  it('maps space and simple punctuation', () => {
    expect(glowCodes(' ', 'mac')).toEqual(['Space'])
    expect(chordFor('?')).toEqual({ code: 'Slash', shift: true, alt: false })
  })
})
