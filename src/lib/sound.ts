import { useDomek } from '../store/useDomek'

/**
 * Tiny synthesised sound kit (Web Audio), so the PoC needs no audio files.
 * Every sound is soft and short. Swap for Howler sprites later behind play().
 */
export type SoundName = 'key' | 'click' | 'pop' | 'correct' | 'wrong' | 'whoosh' | 'fanfare' | 'tick' | 'star' | 'save'

let ctx: AudioContext | null = null
let master: GainNode | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, start: number, dur: number, opts: { type?: OscillatorType; gain?: number; to?: number } = {}) {
  const a = audio()
  if (!a || !master) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t)
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.3, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise(start: number, dur: number, opts: { freq?: number; to?: number; q?: number; gain?: number } = {}) {
  const a = audio()
  if (!a || !master) return
  const t = a.currentTime + start
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = opts.q ?? 1
  f.frequency.setValueAtTime(opts.freq ?? 1200, t)
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur)
  const g = a.createGain()
  g.gain.setValueAtTime(opts.gain ?? 0.3, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(master)
  src.start(t)
}

const C6 = 1046.5, E6 = 1318.5, G6 = 1568, C7 = 2093, G5 = 784, E5 = 659.3, C5 = 523.3

const kit: Record<SoundName, () => void> = {
  key: () => tone(1400, 0, 0.04, { type: 'triangle', gain: 0.08 }),
  click: () => tone(900, 0, 0.06, { type: 'triangle', gain: 0.12, to: 700 }),
  tick: () => tone(1800, 0, 0.03, { type: 'sine', gain: 0.06 }),
  pop: () => {
    noise(0, 0.09, { freq: 1800, to: 400, q: 0.8, gain: 0.5 })
    tone(700, 0, 0.1, { to: 180, gain: 0.25 })
  },
  correct: () => {
    tone(C6, 0, 0.18, { gain: 0.18 })
    tone(E6, 0.07, 0.25, { gain: 0.16 })
  },
  wrong: () => tone(300, 0, 0.22, { type: 'sine', gain: 0.16, to: 200 }),
  whoosh: () => noise(0, 0.35, { freq: 300, to: 2400, q: 0.7, gain: 0.18 }),
  star: () => {
    tone(G6, 0, 0.12, { gain: 0.14 })
    tone(C7, 0.06, 0.3, { gain: 0.12 })
  },
  save: () => {
    tone(E5, 0, 0.12, { type: 'triangle', gain: 0.15 })
    tone(G5, 0.08, 0.2, { type: 'triangle', gain: 0.15 })
  },
  fanfare: () => {
    ;[C5, E5, G5, C6, E6, G6].forEach((f, i) => tone(f, i * 0.09, 0.35, { type: 'triangle', gain: 0.14 }))
    tone(C7, 0.6, 0.7, { gain: 0.12 })
  },
}

export function play(name: SoundName) {
  if (!useDomek.getState().settings.sound) return
  try {
    kit[name]()
  } catch {
    /* audio is a nicety, never a crash */
  }
}

/** Call from the first user gesture so Chrome lets audio start. */
export function unlockAudio() {
  audio()
}
