import { useDomek } from '../store/useDomek'

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
  const chosen = useDomek.getState().settings.voiceName
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

/**
 * What the voice is doing right now, so the friend's mouth can follow it.
 * 'word' comes from the browser's boundary events; some voices (Google's online ones) never send them.
 */
export type SpeechEvent =
  | { type: 'phrase'; text: string; rate: number }
  | { type: 'word'; text: string; charIndex: number; charLength?: number; rate: number }
  | { type: 'pause' }
  | { type: 'end' }

const listeners = new Set<(e: SpeechEvent) => void>()
export function onSpeech(fn: (e: SpeechEvent) => void) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const emit = (e: SpeechEvent) => listeners.forEach((fn) => fn(e))

export interface SpeakOptions {
  /** Stop anything already being said. Default true. */
  interrupt?: boolean
  /** Speak even if the voice setting is off (parent voice test). */
  force?: boolean
  onEnd?: () => void
}

export function speak(text: string, opts: SpeakOptions = {}) {
  const { settings } = useDomek.getState()
  if (typeof speechSynthesis === 'undefined' || (!opts.force && (!settings.voice || !settings.sound))) {
    opts.onEnd?.()
    return
  }
  if (opts.interrupt !== false) {
    speechSynthesis.cancel()
    emit({ type: 'end' })
  }
  const parts = phrases(text)
  if (!parts.length) return opts.onEnd?.()
  const v = pickVoice()
  // Premium / natural voices sound best at their own pace; basic ones a touch slower and brighter.
  const natural = v ? voiceScore(v) >= 35 : false
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part)
    u.lang = 'pl-PL'
    if (v) u.voice = v
    u.rate = natural ? 0.92 : 0.85
    u.pitch = natural ? 1.05 : 1.1
    u.volume = 1
    // Questions and exclamations get a little lift.
    if (/[!?]$/.test(part)) u.pitch += 0.05
    u.onstart = () => emit({ type: 'phrase', text: part, rate: u.rate })
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return
      emit({ type: 'word', text: part, charIndex: e.charIndex, charLength: e.charLength, rate: u.rate })
    }
    const last = i === parts.length - 1
    u.onend = () => {
      emit({ type: last ? 'end' : 'pause' })
      if (last) opts.onEnd?.()
    }
    if (last) u.onerror = () => {
      emit({ type: 'end' })
      opts.onEnd?.()
    }
    speechSynthesis.speak(u)
  })
}

export function stopSpeaking() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  emit({ type: 'end' })
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

/**
 * A child's pace: every pause between steps in a game is stretched by this much,
 * so nothing rushes her and the friend never talks over himself.
 */
export const PACE = 1.5

/**
 * Run `fn` once the friend has finished talking and at least `minMs` (times PACE) has passed.
 * Never waits longer than a few seconds past that, in case speech hangs. Returns a cancel.
 */
export function afterTalk(fn: () => void, minMs: number): () => void {
  const start = performance.now()
  const min = minMs * PACE
  let id = 0
  const tick = () => {
    const t = performance.now() - start
    const talking = typeof speechSynthesis !== 'undefined' && (speechSynthesis.speaking || speechSynthesis.pending)
    if (t >= min && (!talking || t >= min + 6000)) return fn()
    id = window.setTimeout(tick, t < min ? min - t : 120)
  }
  id = window.setTimeout(tick, min)
  return () => window.clearTimeout(id)
}
