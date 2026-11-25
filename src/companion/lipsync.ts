/**
 * Lip sync for the friends. Polish text becomes a row of mouth shapes (visemes) with timings,
 * and a small spring eases the mouth from one shape to the next, the way an animator
 * blends mouth charts instead of snapping between drawings.
 */

export type Viseme = 'rest' | 'A' | 'O' | 'U' | 'E' | 'I' | 'M' | 'F' | 'S' | 'L'

/** Mouth shape: half width, how far the jaw drops, and how round the lips are (0 flat top lip, 1 an O). */
export interface Shape {
  w: number
  open: number
  round: number
}

/** Mouth chart, in viewBox units (the face is 140 wide, the static smile 22). */
export const SHAPES: Record<Viseme, Shape> = {
  rest: { w: 8, open: 0.5, round: 0 },
  A: { w: 11, open: 15, round: 0.15 }, // a: wide and open
  O: { w: 7.5, open: 12.5, round: 1 }, // o, ą: round
  U: { w: 5.5, open: 8, round: 1 }, // u, ó: small round
  E: { w: 11.5, open: 9, round: 0 }, // e, ę: wide, half open
  I: { w: 12, open: 5, round: 0 }, // i, y: wide smile, nearly closed
  M: { w: 8.5, open: 0, round: 0 }, // m, b, p: lips together
  F: { w: 9, open: 3, round: 0 }, // f, w: lip on teeth
  S: { w: 10.5, open: 4.5, round: 0 }, // s, z, c, sz, cz, ś…: teeth close
  L: { w: 9.5, open: 7, round: 0.2 }, // l, n, d, t, r, k, g, h, j: tongue sounds, jaw half way
}

const VOWEL: Record<string, Viseme> = { a: 'A', ą: 'O', o: 'O', ó: 'U', u: 'U', e: 'E', ę: 'E', i: 'I', y: 'I' }

/** The viseme for one letter (lower case). */
export function viseme(ch: string): Viseme {
  if (VOWEL[ch]) return VOWEL[ch]
  if ('mbp'.includes(ch)) return 'M'
  if ('fwv'.includes(ch)) return 'F'
  if ('szcśźżćxq'.includes(ch)) return 'S'
  if (/\p{L}/u.test(ch)) return 'L'
  return 'rest'
}

export interface Key {
  v: Viseme
  /** Start time and length in ms. */
  at: number
  dur: number
}

/**
 * A mouth timeline for some text. Vowels carry the time (they are the syllables you see);
 * consonants are quick passes; spaces barely close the mouth, and commas and full stops rest it.
 * About 13 letters a second at rate 1, close to the browser's Polish voices.
 */
export function timeline(text: string, rate = 1): Key[] {
  const t = text.toLowerCase()
  const k = 1 / Math.max(0.5, rate)
  const keys: Key[] = []
  let at = 0
  const push = (v: Viseme, dur: number) => {
    const d = dur * k
    const prev = keys[keys.length - 1]
    // Two of the same shape in a row read as one held shape.
    if (prev && prev.v === v && prev.at + prev.dur === at) prev.dur += d
    else keys.push({ v, at, dur: d })
    at += d
  }
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    const pair = t.slice(i, i + 2)
    // Digraphs are one sound.
    if (['sz', 'cz', 'rz', 'ch', 'dz', 'dż', 'dź'].includes(pair)) {
      push(pair === 'ch' ? 'L' : 'S', 70)
      i++
      continue
    }
    // "i" before a vowel only softens it (sie, nie, cia): skip its own shape.
    if (c === 'i' && VOWEL[t[i + 1]] && i > 0 && /\p{L}/u.test(t[i - 1])) {
      push('I', 30)
      continue
    }
    const v = viseme(c)
    if (v === 'rest') {
      if (c === ' ') push('L', 35)
      else if (',;:–-'.includes(c)) push('rest', 170)
      else if ('.!?…'.includes(c)) push('rest', 260)
      continue
    }
    push(v, VOWEL[c] ? 105 : v === 'M' ? 70 : 55)
  }
  return keys
}

export const duration = (keys: Key[]) => (keys.length ? keys[keys.length - 1].at + keys[keys.length - 1].dur : 0)

/** The shape the mouth is aiming for at time ms. Past the end it rests. */
export function shapeAt(keys: Key[], ms: number): Shape {
  for (const key of keys) if (ms < key.at + key.dur) return SHAPES[key.v]
  return SHAPES.rest
}

/** The word that starts at charIndex, for boundary events that give no length. */
export function wordAt(text: string, charIndex: number, charLength?: number) {
  if (charLength) return text.slice(charIndex, charIndex + charLength)
  const m = /^[^\s]+/.exec(text.slice(charIndex))
  return m ? m[0] : ''
}

/**
 * The drawn mouth for a shape: a D shape, flat top lip with corners tucked up a little,
 * round bottom lip. Returns the outline and the tongue ellipse that sits inside it.
 */
export function mouthPath(cx: number, y: number, s: Shape) {
  const { w, open, round } = s
  const l = cx - w
  const r = cx + w
  // The top lip dips a little so the corners turn up (a smile even when closed); round lips arch up into an O.
  const top = y + 1.6 - round * open * 0.75
  const low = y + open * 1.33
  const f = (n: number) => n.toFixed(2)
  const d = `M${f(l)} ${y}Q${cx} ${f(top)} ${f(r)} ${y}C${f(r + 0.6 - round * 1.5)} ${f(low)} ${f(l - 0.6 + round * 1.5)} ${f(low)} ${f(l)} ${y}Z`
  const tongue = open > 7 ? { cx, cy: y + open * 0.7, rx: w * 0.5, ry: Math.min(open * 0.22, 3.4) } : null
  return { d, tongue }
}
