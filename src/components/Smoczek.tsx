import { useEffect, useId, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { duration, mouthPath, SHAPES, shapeAt, timeline, wordAt, type Key } from '../companion/lipsync'
import { onSpeech } from '../lib/speak'
import { FRIEND, type Species } from '../companion/species'
import { useDomek, type CompanionColor } from '../store/useDomek'
import { BEAN, BodyClip, OutfitLayer } from '../wardrobe/GadgetArt'
import { gadgetById, wornList, type Outfit } from '../wardrobe/items'

/* Eyes that follow the pointer. One window listener feeds every Smoczek on screen. */
const watchers = new Set<() => void>()
let pointer: { x: number; y: number; t: number } | null = null
let frame = 0
function onPointer(e: PointerEvent) {
  pointer = { x: e.clientX, y: e.clientY, t: performance.now() }
  if (!frame) frame = requestAnimationFrame(() => {
    frame = 0
    watchers.forEach((w) => w())
  })
}
function watchPointer(fn: () => void) {
  if (!watchers.size) window.addEventListener('pointermove', onPointer, { passive: true })
  watchers.add(fn)
  return () => {
    watchers.delete(fn)
    if (!watchers.size) window.removeEventListener('pointermove', onPointer)
  }
}

/** Eye centre and resting pupil position, in viewBox units. */
const EYE = { x: 120, y: 98 }
const REST = { x: 0, y: 0 }
const REACH = { x: 3.5, y: 3.5 }

/** Move the pupils toward the pointer; relax back to centre when the pointer goes quiet. */
function useFollowEyes(svg: React.RefObject<SVGSVGElement | null>, enabled: boolean, remount?: number) {
  useEffect(() => {
    const el = svg.current
    const pupils = el?.querySelector<SVGGElement>('.pupils')
    if (!el || !pupils) return
    if (!enabled) {
      pupils.style.transform = ''
      return
    }
    let idle = 0
    const look = () => {
      if (!pointer) return
      const r = el.getBoundingClientRect()
      if (!r.width) return
      const scale = r.width / 240
      const cx = r.left + EYE.x * scale
      const cy = r.top + EYE.y * scale
      const dx = pointer.x - cx
      const dy = pointer.y - cy
      const dist = Math.hypot(dx, dy) || 1
      // Full reach once the pointer is a little way off; gentle when it is right on him.
      const k = Math.min(1, dist / (r.width * 0.9))
      const x = (dx / dist) * REACH.x * k - REST.x
      const y = (dy / dist) * REACH.y * k - REST.y
      pupils.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
      window.clearTimeout(idle)
      idle = window.setTimeout(() => (pupils.style.transform = ''), 6000)
    }
    look()
    const stop = watchPointer(look)
    return () => {
      stop()
      window.clearTimeout(idle)
      pupils.style.transform = ''
    }
  }, [svg, enabled, remount])
}

/** Talking without a voice (sound off, or a voice that sends no events): a soft babble so the mouth still moves. */
const BABBLE = 'mama ola, tata lubi kasze. ale fajnie!'

/**
 * Lip sync. Follows the voice word by word when the browser reports word boundaries,
 * otherwise plays the whole phrase from its text. Each frame the mouth eases toward the
 * target shape (fast to open, a little slower to close), and the head rides the jaw:
 * a small dip on open vowels and a nod on each new word, so the talking comes from the body, not just the lips.
 */
function useLipSync(svg: React.RefObject<SVGSVGElement | null>, active: boolean, scale = 1) {
  useEffect(() => {
    const el = svg.current
    const lips = el?.querySelector<SVGPathElement>('.m-talk .lips')
    const tongue = el?.querySelector<SVGEllipseElement>('.m-talk .tongue')
    const head = el?.querySelector<SVGGElement>('.head')
    if (!active || !el || !lips || !tongue || !head) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let keys: Key[] = []
    let t0 = performance.now()
    let phrase: { text: string; rate: number } | null = null
    let byWord = false
    let heard = false
    const cur = { ...SHAPES.rest }
    let nod = 0
    let nodV = 0
    let side = 1
    const play = (text: string, rate: number) => {
      keys = timeline(text, rate)
      t0 = performance.now()
    }
    const off = onSpeech((e) => {
      heard = true
      if (e.type === 'phrase') {
        phrase = { text: e.text, rate: e.rate }
        byWord = false
        play(e.text, e.rate)
        nodV -= 0.9
      } else if (e.type === 'word') {
        byWord = true
        const w = wordAt(e.text, e.charIndex, e.charLength)
        play(w, e.rate)
        if (w.length > 2) {
          side = -side
          nodV += 0.55 * side
        }
      } else {
        phrase = null
        keys = []
      }
    })
    const quiet = window.setTimeout(() => {
      if (heard) return
      phrase = { text: BABBLE, rate: 1 }
      play(BABBLE, 1)
    }, 300)
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const ms = now - t0
      // The voice is still going but our guess ran out: keep the phrase moving.
      if (phrase && !byWord && ms > duration(keys) + 120) play(phrase.text, phrase.rate)
      const target = shapeAt(keys, ms)
      const ease = (tau: number) => 1 - Math.exp(-dt / tau)
      cur.open += (target.open - cur.open) * ease(target.open > cur.open ? 28 : 45)
      cur.w += (target.w - cur.w) * ease(55)
      cur.round += (target.round - cur.round) * ease(50)
      const m = mouthPath(120, 110, { w: cur.w * scale, open: cur.open * scale, round: cur.round })
      lips.setAttribute('d', m.d)
      if (m.tongue) {
        tongue.setAttribute('cx', `${m.tongue.cx}`)
        tongue.setAttribute('cy', m.tongue.cy.toFixed(2))
        tongue.setAttribute('rx', m.tongue.rx.toFixed(2))
        tongue.setAttribute('ry', m.tongue.ry.toFixed(2))
        tongue.style.display = ''
      } else tongue.style.display = 'none'
      if (!still) {
        // A damped spring for the nod: kick on words, settle with one small overshoot.
        nodV += (-nod * 0.045 - nodV * 0.18) * (dt / 16)
        nod += nodV * (dt / 16)
        const bob = cur.open * 0.14
        head.setAttribute('transform', `translate(0 ${bob.toFixed(2)}) rotate(${nod.toFixed(2)} 120 150)`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(quiet)
      off()
      head.removeAttribute('transform')
    }
  }, [svg, active, scale])
}

export type Pose = 'idle' | 'happy' | 'cheer' | 'thinking'

/**
 * body, belly, spikes (wings and crest), dark tone (text on his colour), feet.
 * Drawn in the house style: one ink outline for every hue, flat muted pastels.
 */
export const COMPANION_COLORS: Record<CompanionColor, [string, string, string, string, string]> = {
  mint: ['#8ED3A6', '#FFFDF5', '#C9EBD3', '#1F4D3A', '#62B385'],
  sky: ['#8CC3EC', '#FFFDF5', '#CBE3F6', '#04374F', '#5F9FD3'],
  lavender: ['#BBAEEC', '#FFFDF5', '#DFD8F7', '#332C54', '#9686D6'],
  peach: ['#F5B386', '#FFFDF5', '#FAD6BE', '#4E270D', '#DE9160'],
  pink: ['#F2AAC2', '#FFFDF5', '#F8D3E0', '#4F2035', '#DA86A5'],
}

type Palette = [body: string, belly: string, accent: string, dark: string, feet: string]

/**
 * Five colours for every friend. The keys are colour families shared by all friends, so a saved colour
 * keeps working when she switches friends. Each friend's natural look is one of them (see NATURAL).
 * accent = dragon crest and wings, pony mane, puppy ears.
 */
export const PALETTES: Record<Species, Record<CompanionColor, Palette>> = {
  smok: COMPANION_COLORS,
  konik: {
    peach: ['#E6BC8E', '#FFF6E8', '#8A5A3B', '#4E270D', '#8A5A3B'],
    sky: ['#F2EFEA', '#FFFFFF', '#9AA0B2', '#3A3F5C', '#9AA0B2'],
    pink: ['#F4B6CB', '#FFF3F7', '#B98AD9', '#4F2035', '#B98AD9'],
    lavender: ['#C9BDF0', '#F6F3FF', '#F2A7C0', '#332C54', '#8E7BD0'],
    mint: ['#A8D8B8', '#F3FBF5', '#F6D58A', '#1F4D3A', '#5E9C76'],
  },
  koala: {
    sky: ['#B9BFCB', '#F4F4F7', '#F4F4F7', '#2E3140', '#9298A6'],
    lavender: ['#C6BCE8', '#F6F3FF', '#F6F3FF', '#332C54', '#9C8FD0'],
    pink: ['#F2B8CB', '#FFF3F7', '#FFF3F7', '#4F2035', '#D98BA6'],
    mint: ['#A8D8B8', '#F3FBF5', '#F3FBF5', '#1F4D3A', '#6FB287'],
    peach: ['#F5C29C', '#FFF6EE', '#FFF6EE', '#4E270D', '#DE9A68'],
  },
  piesek: {
    peach: ['#EBA672', '#FFFDF5', '#B9784A', '#4E270D', '#B9784A'],
    sky: ['#F2EFEA', '#FFFFFF', '#6B6F80', '#3A3F5C', '#6B6F80'],
    pink: ['#F4B6CB', '#FFF3F7', '#D9789B', '#4F2035', '#D9789B'],
    lavender: ['#C9BDF0', '#F6F3FF', '#8E7BD0', '#332C54', '#8E7BD0'],
    mint: ['#A8D8B8', '#F3FBF5', '#5E9C76', '#1F4D3A', '#5E9C76'],
  },
}

/** Each friend's own colour, picked first when she chooses that friend. */
export const NATURAL: Record<Species, CompanionColor> = { smok: 'mint', konik: 'peach', koala: 'sky', piesek: 'peach' }

/** The colour order shown when she picks a colour: the natural one first. */
export const colorsFor = (species: Species): CompanionColor[] => {
  const all = Object.keys(PALETTES[species]) as CompanionColor[]
  return [NATURAL[species], ...all.filter((c) => c !== NATURAL[species])]
}

/** Colours for the friend she picked. */
export const friendColors = (species: Species, color: CompanionColor) => PALETTES[species][color] ?? PALETTES[species][NATURAL[species]]

/**
 * What makes each friend itself, drawn on the shared bean (240×260, head top at y 44, eyes at 92/148, y 98).
 *   behind  before the body: wings, horns, ears that stick up
 *   tail    swings with the tail animation
 *   front   on the body, under clothes and hats: floppy ears, mane, face patches
 *   face    over the cheeks: noses
 */
interface Parts {
  behind?: ReactNode
  tail?: ReactNode
  front?: ReactNode
  face?: ReactNode
  /** Mouth moved down to sit under a nose. */
  mouthDy?: number
  /** A smaller talking mouth, where it has to fit inside a muzzle. */
  mouthScale?: number
  /** On the belly, under the clothes: the dragon's stripes. */
  belly?: ReactNode
  /** Big round eyes with whites (the first Smoczek), instead of sticker dot eyes. */
  bigEyes?: boolean
}

const PARTS: Record<Species, Parts> = {
  smok: {
    behind: (
      <>
        <path className="wingL ln" d="M58 128C40 104 16 108 18 132c8-3 15 1 16 8 7-3 15 0 18 7z" fill="var(--spike)" />
        <path className="wingR ln" d="M182 128c18-24 42-20 40 4-8-3-15 1-16 8-7-3-15 0-18 7z" fill="var(--spike)" />
        {/* The first Smoczek's crest and horns: three pointed spikes and two curled horns. */}
        <path className="ln" d="M102 50l7-17 8 15zM114 46l8-19 8 17zM127 48l9-16 6 17z" fill="var(--spike)" />
        <path className="ln" d="M80 68C68 38 74 28 92 42c2 8 2 14 0 22zM160 68c12-30 6-40-12-26-2 8-2 14 0 22z" fill="#F6D58A" />
      </>
    ),
    belly: <path d="M96 166q24 8 48 0M90 184q30 9 60 0M94 202q26 8 52 0" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" opacity=".3" />,
    face: (
      // A soft snout with two little nostrils, like the first drawing.
      <>
        <ellipse className="ln" cx="120" cy="123" rx="27" ry="15" fill="var(--belly)" strokeWidth="3" />
        <circle cx="112" cy="117" r="2.4" fill="var(--ink)" />
        <circle cx="128" cy="117" r="2.4" fill="var(--ink)" />
      </>
    ),
    mouthDy: 15,
    mouthScale: 0.8,
    bigEyes: true,
    tail: (
      <>
        <path d="M176 216C204 226 222 210 216 180" fill="none" stroke="var(--ink)" strokeWidth="20" strokeLinecap="round" />
        <path d="M176 216C204 226 222 210 216 180" fill="none" stroke="var(--body)" strokeWidth="12" strokeLinecap="round" />
        <path className="ln" d="M216 158c7 6 10 12 8 18-2 5-8 7-8 7s-6-2-8-7c-2-6 1-12 8-18z" fill="var(--spike)" />
      </>
    ),
  },
  konik: {
    behind: (
      <>
        <g className="ear earL ln" style={{ transformOrigin: '86px 70px' }}>
          <path d="M74 74C66 52 68 32 76 26c8 6 18 20 20 34" fill="var(--body)" />
          <path d="M79 58c-3-10-2-19 1-23 4 4 8 11 9 18" fill="#F7B7C5" strokeWidth="0" />
        </g>
        <g className="ear earR ln" style={{ transformOrigin: '154px 70px' }}>
          <path d="M166 74c8-22 6-42-2-48-8 6-18 20-20 34" fill="var(--body)" />
          <path d="M161 58c3-10 2-19-1-23-4 4-8 11-9 18" fill="#F7B7C5" strokeWidth="0" />
        </g>
      </>
    ),
    tail: (
      <path className="ln" d="M182 200c22-8 36 4 38 22 2 10-2 20-8 24 0-8-4-14-10-16 2 8 0 14-6 18-1-10-6-18-14-22z" fill="var(--spike)" />
    ),
    front: (
      // Forelock: a tuft falling on the forehead. It bounces a beat after the head.
      <g className="ln forelock" fill="var(--spike)" style={{ transformOrigin: '124px 44px' }}>
        <path d="M92 58c6-16 22-24 36-20 10-6 26 0 28 10-8-2-14 2-16 8-6-6-14-8-22-4-6-4-16-2-26 6z" />
      </g>
    ),
    face: (
      // A white blaze down the face into a wide, low muzzle with two round nostrils: the horse's nose.
      <>
        <path d="M116 60c4-2 6-2 8 0l3 50h-14z" fill="var(--belly)" />
        <path className="ln" d="M120 108c20 0 33 8 33 21 0 12-14 19-33 19s-33-7-33-19c0-13 13-21 33-21z" fill="var(--belly)" />
        <circle cx="106" cy="124" r="4" fill="var(--ink)" />
        <circle cx="134" cy="124" r="4" fill="var(--ink)" />
      </>
    ),
    mouthDy: 25,
    mouthScale: 0.75,
  },
  koala: {
    front: (
      <>
        <g className="ear earL ln" style={{ transformOrigin: '80px 84px' }}>
          <circle cx="58" cy="66" r="30" fill="var(--body)" />
          <circle cx="60" cy="68" r="17" fill="var(--belly)" strokeWidth="0" />
        </g>
        <g className="ear earR ln" style={{ transformOrigin: '160px 84px' }}>
          <circle cx="182" cy="66" r="30" fill="var(--body)" />
          <circle cx="180" cy="68" r="17" fill="var(--belly)" strokeWidth="0" />
        </g>
      </>
    ),
    face: (
      <>
        <path className="ln" d="M120 96c9 0 13 6 13 14 0 9-6 15-13 15s-13-6-13-15c0-8 4-14 13-14z" fill="#5B5F75" />
        <path d="M114 103c1-2 3-3 5-3" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".8" />
      </>
    ),
    mouthDy: 20,
  },
  piesek: {
    tail: (
      <path className="ln" d="M184 206c14-2 24-10 26-24 1-6 8-6 9 0 1 18-12 32-32 34z" fill="var(--body)" />
    ),
    front: (
      <>
        <path d="M120 64c-8 0-10 10-10 20 0 10-6 14-6 22 0 10 7 14 16 14s16-4 16-14c0-8-6-12-6-22 0-10-2-20-10-20z" fill="var(--belly)" />
        <path className="ear earL flop ln" fill="var(--spike)" style={{ transformOrigin: '68px 62px' }} d="M70 58c-20-4-32 14-30 34 1 12 6 22 14 24 6 1 10-6 12-14z" />
        <path className="ear earR flop ln" fill="var(--spike)" style={{ transformOrigin: '172px 62px' }} d="M170 58c20-4 32 14 30 34-1 12-6 22-14 24-6 1-10-6-12-14z" />
      </>
    ),
    face: <path className="ln" d="M120 104c5 0 8 1.6 8 4.4 0 3-4 6-8 6s-8-3-8-6c0-2.8 3-4.4 8-4.4z" fill="var(--ink)" strokeWidth="2.5" />,
    mouthDy: 8,
  },
}

interface Props {
  pose?: Pose
  color?: CompanionColor
  talking?: boolean
  size?: number | string
  className?: string
  label?: string
  /** Re-trigger a one-shot pose animation by changing this key. */
  beat?: number
  /** Eyes follow the mouse pointer (on by default). */
  followEyes?: boolean
  /** Gadgets to wear. Defaults to what he has on in the wardrobe; pass {} for none. */
  outfit?: Outfit
  /** Which friend to draw. Defaults to the one she picked. */
  species?: Species
}

/**
 * Her friend: a bean-shaped little character with dot eyes and pink blush, like a sticker.
 * By default Smoczek the dragon (horns, crest, wings, curly tail); also a pony, a koala or a puppy.
 * Head and body are one shape, so every wardrobe item fits every friend.
 */
export function Smoczek({ pose = 'idle', color = 'mint', talking = false, size = 240, className = '', label, beat, followEyes = true, outfit, species }: Props) {
  const worn = useDomek((s) => s.wardrobe?.worn)
  const picked = useDomek((s) => s.profile?.companion)
  const kind: Species = species ?? picked ?? 'smok'
  const part = PARTS[kind]
  const saved = useMemo(() => wornList(worn), [worn])
  const wearing = outfit ?? saved
  const holding = wearing.some((id) => gadgetById(id)?.slot === 'hand')
  const clipId = `smok-body-${useId().replace(/:/g, '')}`
  const ref = useRef<SVGSVGElement>(null)
  // Thinking looks up and away on purpose, so the eyes stop following then.
  useFollowEyes(ref, followEyes && pose !== 'thinking' && pose !== 'cheer', beat)
  useLipSync(ref, talking, part.mouthScale)
  const [body, belly, spike, , foot] = friendColors(kind, color)
  const style = { '--body': body, '--belly': belly, '--spike': spike, '--foot': foot, '--mouth-y': `${110 + (part.mouthDy ?? 0)}px`, width: size, height: 'auto' } as CSSProperties
  return (
    <svg ref={ref} key={beat} className={`smok ${pose} ${talking ? 'talking' : ''} ${className}`} viewBox="0 0 240 260" role="img" aria-label={label ?? FRIEND[kind].name} style={style}>
      <defs>
        <BodyClip id={clipId} />
      </defs>
      <ellipse cx="120" cy="250" rx="66" ry="7" fill="#2E2A33" opacity=".08" />
      <g className="whole">
       <g className="lean">
        <OutfitLayer outfit={wearing} layer="back" />
        <g className="spark ln" fill="#F6D58A">
          <path d="M28 70l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" />
          <path d="M210 96l4 8 8 4-8 4-4 8-4-8-8-4 8-4z" />
          <path d="M200 30l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
        </g>
        <g className="dots ln" fill="#fff" strokeWidth="3">
          <circle cx="190" cy="60" r="6" />
          <circle cx="205" cy="40" r="9" />
          <circle cx="224" cy="16" r="12" />
        </g>
        <g className="tail">
          {part.tail}
          <OutfitLayer outfit={wearing} layer="tail" />
        </g>
        {part.behind}
        <g className="body">
          <ellipse className="ln" cx="94" cy="240" rx="18" ry="10" fill="var(--foot)" />
          <ellipse className="ln" cx="146" cy="240" rx="18" ry="10" fill="var(--foot)" />
          <path className="ln" d={BEAN} fill="var(--body)" />
          <ellipse cx="120" cy="184" rx="40" ry="44" fill="var(--belly)" />
          {part.belly}
          <OutfitLayer outfit={wearing} layer="body" clipId={clipId} />
          {/* Ears, mane and face patches after the clothes: the clothes redraw the body outline, which would cut through the ears. */}
          {part.front}
          {/* Shoes sit in front of the body and its tops and trousers, but under skirts and gowns,
              so a hem falls over them and the toes peek out below. */}
          <OutfitLayer outfit={wearing} layer="feet" />
          <OutfitLayer outfit={wearing} layer="over" />
        </g>
        <g className="head">
          <g className="cheeks">
            <circle cx="72" cy="116" r="13" fill="#F7B7C5" />
            <circle cx="168" cy="116" r="13" fill="#F7B7C5" />
            <circle cx="67" cy="111" r="2.6" fill="#fff" />
            <circle cx="73" cy="108" r="1.6" fill="#fff" />
            <circle cx="163" cy="111" r="2.6" fill="#fff" />
            <circle cx="169" cy="108" r="1.6" fill="#fff" />
          </g>
          {part.face}
          <g className="eyes">
            {part.bigEyes ? (
              <g className="lid">
                <ellipse className="ln" cx="92" cy="94" rx="14" ry="16" fill="#fff" strokeWidth="3.5" />
                <ellipse className="ln" cx="148" cy="94" rx="14" ry="16" fill="#fff" strokeWidth="3.5" />
                <g className="pupils">
                  <circle cx="93" cy="97" r="7.5" fill="var(--ink)" />
                  <circle cx="149" cy="97" r="7.5" fill="var(--ink)" />
                  <circle cx="96" cy="93" r="3" fill="#fff" />
                  <circle cx="152" cy="93" r="3" fill="#fff" />
                </g>
              </g>
            ) : (
              <g className="lid">
                <g className="pupils">
                  <ellipse cx="92" cy="98" rx="7" ry="8.5" fill="var(--ink)" />
                  <ellipse cx="148" cy="98" rx="7" ry="8.5" fill="var(--ink)" />
                  <circle cx="94.5" cy="94.5" r="2.6" fill="#fff" />
                  <circle cx="150.5" cy="94.5" r="2.6" fill="#fff" />
                </g>
              </g>
            )}
          </g>
          <g className="eyesHappy" fill="none" stroke="var(--ink)" strokeWidth="4.5" strokeLinecap="round">
            <path d={part.bigEyes ? 'M80 99q12-14 24 0' : 'M83 101q9-11 18 0'} />
            <path d={part.bigEyes ? 'M136 99q12-14 24 0' : 'M139 101q9-11 18 0'} />
          </g>
          <g transform={part.mouthDy ? `translate(0 ${part.mouthDy})` : undefined}>
            <path className="m m-idle" d="M111 112q4.5 5 9 0q4.5 5 9 0" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <g className="m m-happy">
              <path className="ln" d="M109 110q11 15 22 0z" fill="var(--mouth)" strokeWidth="3.5" />
              <path d="M114 117q6-4 12 0q-6 5-12 0z" fill="var(--tongue)" />
            </g>
            <g className="m m-cheer">
              <path className="ln" d="M106 108q14 22 28 0z" fill="var(--mouth)" strokeWidth="3.5" />
              <path d="M112 119q8-5 16 0q-8 7-16 0z" fill="var(--tongue)" />
            </g>
            <path className="m m-think" d="M112 114q5-3 9 0t9 0" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
            {/* The talking mouth: one shape the lip sync reshapes every frame. */}
            <g className="m-talk">
              <path className="lips ln" d={mouthPath(120, 110, SHAPES.rest).d} fill="var(--mouth)" strokeWidth="3" />
              <ellipse className="tongue" cx="120" cy="116" rx="5" ry="2" fill="var(--tongue)" />
            </g>
          </g>
          <OutfitLayer outfit={wearing} layer="head" />
        </g>
        <g className="armL">
          <rect className="ln" x="26" y="150" width="32" height="18" rx="9" fill="var(--body)" transform="rotate(-28 54 159)" />
          <g transform="translate(-29 -30)">
            <OutfitLayer outfit={wearing} layer="hand" />
            {/* The paw closes over whatever it holds: the arm's round tip drawn again on top of the handle. */}
            {holding && <circle className="ln" cx="66.2" cy="197.9" r="9" fill="var(--body)" />}
          </g>
        </g>
        <g className="armR">
          <rect className="ln" x="182" y="150" width="32" height="18" rx="9" fill="var(--body)" transform="rotate(28 186 159)" />
        </g>
       </g>
      </g>
    </svg>
  )
}
