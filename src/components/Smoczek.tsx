import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { useDomek, type CompanionColor } from '../store/useDomek'
import { BEAN, BodyClip, OutfitLayer } from '../wardrobe/GadgetArt'
import type { Outfit } from '../wardrobe/items'

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
}

/**
 * Smoczek: a bean-shaped little dragon. Dot eyes, pink blush, two horns and a soft crest,
 * nub arms, small wings and a curly tail. Head and body are one shape, like a sticker.
 */
export function Smoczek({ pose = 'idle', color = 'mint', talking = false, size = 240, className = '', label = 'Smoczek', beat, followEyes = true, outfit }: Props) {
  const worn = useDomek((s) => s.wardrobe?.worn)
  const wearing = outfit ?? worn
  const clipId = `smok-body-${useId().replace(/:/g, '')}`
  const ref = useRef<SVGSVGElement>(null)
  // Thinking looks up and away on purpose, so the eyes stop following then.
  useFollowEyes(ref, followEyes && pose !== 'thinking' && pose !== 'cheer', beat)
  const [body, belly, spike, , foot] = COMPANION_COLORS[color]
  const style = { '--body': body, '--belly': belly, '--spike': spike, '--foot': foot, width: size, height: 'auto' } as CSSProperties
  return (
    <svg ref={ref} key={beat} className={`smok ${pose} ${talking ? 'talking' : ''} ${className}`} viewBox="0 0 240 260" role="img" aria-label={label} style={style}>
      <defs>
        <BodyClip id={clipId} />
      </defs>
      <ellipse cx="120" cy="250" rx="66" ry="7" fill="#2E2A33" opacity=".08" />
      <g className="whole">
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
          <path d="M176 216C204 226 222 210 216 180" fill="none" stroke="var(--ink)" strokeWidth="20" strokeLinecap="round" />
          <path d="M176 216C204 226 222 210 216 180" fill="none" stroke="var(--body)" strokeWidth="12" strokeLinecap="round" />
          <path className="ln" d="M216 158c7 6 10 12 8 18-2 5-8 7-8 7s-6-2-8-7c-2-6 1-12 8-18z" fill="var(--spike)" />
          <OutfitLayer outfit={wearing} layer="tail" />
        </g>
        <path className="wingL ln" d="M58 128C40 104 16 108 18 132c8-3 15 1 16 8 7-3 15 0 18 7z" fill="var(--spike)" />
        <path className="wingR ln" d="M182 128c18-24 42-20 40 4-8-3-15 1-16 8-7-3-15 0-18 7z" fill="var(--spike)" />
        <g className="crest ln" fill="var(--spike)">
          <path d="M98 54c-2-12 4-20 12-18 4 1 6 6 6 12" />
          <path d="M112 50c-1-14 6-22 14-20 6 2 7 9 6 18" />
          <path d="M128 50c2-10 9-15 15-11 4 3 4 9 1 15" />
        </g>
        <g className="horns ln" fill="#F6D58A">
          <path d="M80 70c-10-16-10-30-2-34 7-3 14 8 16 22" />
          <path d="M160 70c10-16 10-30 2-34-7-3-14 8-16 22" />
        </g>
        <g className="body">
          <ellipse className="ln" cx="94" cy="240" rx="18" ry="10" fill="var(--foot)" />
          <ellipse className="ln" cx="146" cy="240" rx="18" ry="10" fill="var(--foot)" />
          <path className="ln" d={BEAN} fill="var(--body)" />
          <ellipse cx="120" cy="184" rx="40" ry="44" fill="var(--belly)" />
          <OutfitLayer outfit={wearing} layer="body" clipId={clipId} />
          <OutfitLayer outfit={wearing} layer="over" />
          <OutfitLayer outfit={wearing} layer="feet" />
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
          <g className="eyes">
            <g className="lid">
              <g className="pupils">
                <ellipse cx="92" cy="98" rx="7" ry="8.5" fill="var(--ink)" />
                <ellipse cx="148" cy="98" rx="7" ry="8.5" fill="var(--ink)" />
                <circle cx="94.5" cy="94.5" r="2.6" fill="#fff" />
                <circle cx="150.5" cy="94.5" r="2.6" fill="#fff" />
              </g>
            </g>
          </g>
          <g className="eyesHappy" fill="none" stroke="var(--ink)" strokeWidth="4.5" strokeLinecap="round">
            <path d="M83 101q9-11 18 0" />
            <path d="M139 101q9-11 18 0" />
          </g>
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
          <OutfitLayer outfit={wearing} layer="head" />
        </g>
        <g className="armL">
          <rect className="ln" x="26" y="150" width="32" height="18" rx="9" fill="var(--body)" transform="rotate(-28 54 159)" />
          <g transform="translate(-29 -30)">
            <OutfitLayer outfit={wearing} layer="hand" />
          </g>
        </g>
        <rect className="armR ln" x="182" y="150" width="32" height="18" rx="9" fill="var(--body)" transform="rotate(28)" />
      </g>
    </svg>
  )
}
