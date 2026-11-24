import { useOkienko } from '../store/useOkienko'

/**
 * Smoczek's voice. One function, so a better voice (recorded lines, a cloud TTS)
 * can replace the browser's Web Speech voices later without touching callers.
 */

let voices: SpeechSynthesisVoice[] = []

function loadVoices() {
  if (typeof speechSynthesis === 'undefined') return
  voices = speechSynthesis.getVoices()
}
if (typeof speechSynthesis !== 'undefined') {
  loadVoices()
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
}

// Friendlier voices first: macOS "Zosia", Windows "Paulina", Chrome's "Google polski".
const PREFERRED = [/zosia/i, /paulina/i, /google polski/i, /marek/i, /adam/i]

export function polishVoices(): SpeechSynthesisVoice[] {
  return voices.filter((v) => v.lang.toLowerCase().startsWith('pl'))
}

function pickVoice(): SpeechSynthesisVoice | null {
  const pl = polishVoices()
  if (!pl.length) return null
  const chosen = useOkienko.getState().settings.voiceName
  const byName = chosen && pl.find((v) => v.name === chosen)
  if (byName) return byName
  for (const re of PREFERRED) {
    const v = pl.find((x) => re.test(x.name))
    if (v) return v
  }
  return pl[0]
}

export interface SpeakOptions {
  /** Stop anything already being said. Default true. */
  interrupt?: boolean
  /** Speak even if the voice setting is off (parent voice test). */
  force?: boolean
  onEnd?: () => void
}

export function speak(text: string, opts: SpeakOptions = {}) {
  const { settings } = useOkienko.getState()
  if (typeof speechSynthesis === 'undefined' || (!opts.force && (!settings.voice || !settings.sound))) {
    opts.onEnd?.()
    return
  }
  if (opts.interrupt !== false) speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'pl-PL'
  const v = pickVoice()
  if (v) u.voice = v
  u.rate = 0.95
  u.pitch = 1.15
  u.onend = () => opts.onEnd?.()
  u.onerror = () => opts.onEnd?.()
  speechSynthesis.speak(u)
}

export function stopSpeaking() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
}

/** Spell a single letter the way a Polish teacher would say it. */
export function letterName(char: string): string {
  const names: Record<string, string> = {
    ą: 'ą, z ogonkiem', ę: 'ę, z ogonkiem', ć: 'ć, z kreską', ń: 'ń, z kreską', ó: 'ó, z kreską', ś: 'ś, z kreską',
    ź: 'ź, z kreską', ż: 'ż, z kropką', ł: 'ł', y: 'igrek', q: 'ku', v: 'fał', x: 'iks', w: 'wu',
  }
  const c = char.toLowerCase()
  return names[c] ?? c
}
