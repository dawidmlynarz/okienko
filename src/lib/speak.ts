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

/**
 * Rank Polish voices by how natural they sound. Higher is better.
 * macOS: downloadable "Ewa (Premium)" / "Zosia (Enhanced)" are far better than the default Zosia.
 * Chrome everywhere: "Google polski" (online) beats Windows' built-in Paulina.
 */
export function voiceScore(v: Pick<SpeechSynthesisVoice, 'name' | 'localService'>): number {
  const n = v.name.toLowerCase()
  let score = 0
  if (/natural|neural|online/.test(n)) score += 60
  if (/premium/.test(n)) score += 50
  if (/enhanced|ulepsz|rozszerz/.test(n)) score += 40
  if (/google/.test(n)) score += 35
  if (/ewa/.test(n)) score += 8
  if (/zosia/.test(n)) score += 6
  if (/paulina/.test(n)) score += 2
  if (/compact|eloquence|grandma|grandpa|rocko|shelley|flo|reed|sandy/.test(n)) score -= 40
  return score
}

export function polishVoices(): SpeechSynthesisVoice[] {
  return voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('pl')).sort((a, b) => voiceScore(b) - voiceScore(a))
}

/** A short quality label for the parent panel. */
export function voiceQuality(v: SpeechSynthesisVoice): string {
  const s = voiceScore(v)
  return s >= 35 ? 'naturalny' : s >= 6 ? 'dobry' : 'podstawowy'
}

function pickVoice(): SpeechSynthesisVoice | null {
  const pl = polishVoices()
  if (!pl.length) return null
  const chosen = useOkienko.getState().settings.voiceName
  return (chosen && pl.find((v) => v.name === chosen)) || pl[0]
}

/**
 * Split into short phrases. Browser voices sound much less flat when each sentence
 * is its own utterance (they reset intonation and pause naturally), and Chrome
 * cuts off utterances longer than about 15 seconds.
 */
export function phrases(text: string): string[] {
  return text
    .replace(/…/g, '.')
    .replace(/[„”"]/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
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
  const parts = phrases(text)
  if (!parts.length) return opts.onEnd?.()
  const v = pickVoice()
  // Premium / natural voices sound best at their own pace; basic ones a touch slower and brighter.
  const natural = v ? voiceScore(v) >= 35 : false
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part)
    u.lang = 'pl-PL'
    if (v) u.voice = v
    u.rate = natural ? 1 : 0.92
    u.pitch = natural ? 1.05 : 1.1
    u.volume = 1
    // Questions and exclamations get a little lift.
    if (/[!?]$/.test(part)) u.pitch += 0.05
    if (i === parts.length - 1) {
      u.onend = () => opts.onEnd?.()
      u.onerror = () => opts.onEnd?.()
    }
    speechSynthesis.speak(u)
  })
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
