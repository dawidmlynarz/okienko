import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { gadgetById, type Outfit } from './items'

/**
 * Gadget drawings, in Smoczek's own 240×260 coordinates so they sit on him exactly.
 * Each gadget may draw on several layers:
 *   back   behind him (capes, wings, backpacks)
 *   tail   on the tail, moves with it
 *   body   clothes on his tummy, clipped to the body shape
 *   over   clothes that stick out past the body (skirts, straps), under the arms
 *   feet   shoes, over his feet
 *   hand   held in his left paw, moves with the arm
 *   head   hats, glasses and neckwear, move with the head
 */
export type Layer = 'back' | 'tail' | 'body' | 'over' | 'feet' | 'hand' | 'head'

const LINE = 'var(--ink, #2E2A33)'
const W = 4
const ln = { stroke: LINE, strokeWidth: W, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

/** Smoczek's bean-shaped body (head and tummy in one), and his paw and feet. */
export const BEAN = 'M120 44C163 44 188 72 189 116L191 194C192 228 162 242 120 242C78 242 48 228 49 194L51 116C52 72 77 44 120 44Z'
const HAND = { x: 63, y: 200 }
const FEET = [94, 146]

const star = (cx: number, cy: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const rr = i % 2 ? r * 0.45 : r
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`
  })
  return `M${pts.join('L')}Z`
}

const heart = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy + s * 0.9}C${cx - s * 1.5} ${cy + s * 0.05} ${cx - s * 1.05} ${cy - s * 1.1} ${cx} ${cy - s * 0.38}C${cx + s * 1.05} ${cy - s * 1.1} ${cx + s * 1.5} ${cy + s * 0.05} ${cx} ${cy + s * 0.9}Z`

const oval = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`

/** A thick line with an outline: draw the outline wider first, then the colour. */
const band = (d: string, color: string, width: number, extra?: ReactNode) => (
  <>
    <path d={d} fill="none" stroke={LINE} strokeWidth={width + W * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    {extra}
  </>
)

/** A small five-petal flower. */
const flower = (cx: number, cy: number, r: number, petal: string, key?: string | number) => (
  <g key={key}>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2
      return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={r * 0.75} fill={petal} stroke={LINE} strokeWidth="2" />
    })}
    <circle cx={cx} cy={cy} r={r * 0.6} fill="#F2C866" stroke={LINE} strokeWidth="2" />
  </g>
)

/** A ribbon bow centred on (cx, cy). */
const bow = (cx: number, cy: number, s: number, color: string, knot: string) => (
  <g>
    <path d={`M${cx} ${cy}L${cx - 18 * s} ${cy - 12 * s}Q${cx - 22 * s} ${cy} ${cx - 18 * s} ${cy + 12 * s}Z`} fill={color} {...ln} />
    <path d={`M${cx} ${cy}L${cx + 18 * s} ${cy - 12 * s}Q${cx + 22 * s} ${cy} ${cx + 18 * s} ${cy + 12 * s}Z`} fill={color} {...ln} />
    <circle cx={cx} cy={cy} r={6 * s} fill={knot} {...ln} />
  </g>
)

/** Draw the same shoe on both feet. */
const pair = (draw: (cx: number) => ReactNode) => <>{FEET.map((cx) => <g key={cx}>{draw(cx)}</g>)}</>

/** Glasses bridge and arms, shared by most eyewear. */
const frame = (color: string) => <path d="M114 92Q120 85 126 92M70 90L54 84M170 90L186 84" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />

/**
 * Hats were drawn sitting on the very top of the dome and looked perched. This sits a hat lower and a touch
 * wider, so the brim hugs the head at forehead height.
 */
const onHead = (node: ReactNode, dy = 8, s = 1.06) => <g transform={`translate(120 ${60 + dy}) scale(${s}) translate(-120 -60)`}>{node}</g>

/** A shirt front with a round neckline (the old ones stopped in a hard flat edge). Body layer, clipped to the bean. */
const NECK = 'M30 134Q120 154 210 134'
const shirt = (color: string) => <path d={`${NECK}V262H30Z`} fill={color} />
const neckline = <path d={NECK} fill="none" stroke={LINE} strokeWidth="4" />

/**
 * Hems and waistbands bow downward a little, the way cloth wraps a round tummy.
 * Straight edges made clothes look like stickers laid on top.
 */
const curve = (y: number, x0 = 46, x1 = 194) => `M${x0} ${y}Q120 ${y + 14} ${x1} ${y}`
/** A top from the neckline down to a curved hem. */
const top = (color: string, hemY: number) => <path d={`${NECK}V${hemY}Q120 ${hemY + 14} 30 ${hemY}Z`} fill={color} />
const hem = (y: number) => <path d={curve(y, 30, 210)} fill="none" stroke={LINE} strokeWidth="4" />
const waist = (y: number, color: string) => band(curve(y, 48, 192), color, 9)
/** A skirt from a curved waist out to a wider, curved hem. */
const skirt = (y: number, hemY: number, flare: number) =>
  `M50 ${y}Q120 ${y + 14} 190 ${y}L${240 - flare} ${hemY}Q120 ${hemY + 18} ${flare} ${hemY}Z`

type Art = Partial<Record<Layer, ReactNode>>

export const GADGET_ART: Record<string, Art> = {
  /* ── Czapki ─────────────────────────────────────────── */
  kokarda: { head: bow(146, 50, 1.25, '#EC8CAB', '#C0587E') },
  czapka: {
    head: onHead(
      <g>
        <path d="M80 60C78 14 162 14 160 60Z" fill="#E8857C" {...ln} />
        <path d="M102 26v26M120 20v32M138 26v26" stroke="#F8C4BC" strokeWidth="5" strokeLinecap="round" />
        <rect x="72" y="50" width="96" height="18" rx="9" fill="#FFFDF5" {...ln} />
        <circle cx="120" cy="14" r="11" fill="#FFFDF5" {...ln} />
      </g>,
      8,
    ),
  },
  daszek: {
    head: onHead(
      <g>
        <path d="M148 58Q186 54 200 64Q176 74 148 68Z" fill="#5A8FC9" {...ln} />
        <path d="M80 62C78 22 162 22 160 62Z" fill="#7DB9E8" {...ln} />
        <path d="M120 24V60M98 30Q104 46 102 60M142 30Q136 46 138 60" fill="none" stroke="#5A8FC9" strokeWidth="3" />
        <circle cx="120" cy="24" r="5" fill="#5A8FC9" {...ln} />
        <path d={star(120, 46, 8)} fill="#F6D58A" />
      </g>,
      8,
    ),
  },
  urodzinowa: {
    head: onHead(
      <g transform="rotate(10 121 58)">
        <path d="M96 60L121 0L146 60Q121 68 96 60Z" fill="#BBAEEC" {...ln} />
        <circle cx="114" cy="44" r="4.5" fill="#F6D58A" />
        <circle cx="130" cy="34" r="4" fill="#F2A7C0" />
        <circle cx="124" cy="52" r="4" fill="#8ED3A6" />
        <circle cx="120" cy="22" r="3.5" fill="#F6D58A" />
        <circle cx="121" cy="0" r="8" fill="#F2A7C0" {...ln} />
      </g>,
      6,
    ),
  },
  wianek: {
    head: (
      <g>
        {band('M78 60Q120 38 162 60', '#8ED3A6', 6)}
        {[
          [82, 58, '#F2A7C0'],
          [100, 49, '#FFFDF5'],
          [120, 45, '#BBAEEC'],
          [140, 49, '#FFFDF5'],
          [158, 58, '#F2A7C0'],
        ].map(([x, y, c], i) => flower(x as number, y as number, 6, c as string, i))}
      </g>
    ),
  },
  kowboj: {
    head: onHead(
      <g>
        <path d="M90 56Q86 18 104 20Q120 30 136 20Q154 18 150 56Z" fill="#C98A5E" {...ln} />
        <path d="M90 46Q120 54 150 46" fill="none" stroke="#8A5A3B" strokeWidth="7" />
        <path d="M60 52Q66 64 120 66Q174 64 180 52Q184 66 170 70Q120 82 70 70Q56 66 60 52Z" fill="#B07A4E" {...ln} />
        <path d={star(138, 48, 5)} fill="#F6D58A" />
      </g>,
      8,
    ),
  },
  czarodziej: {
    head: onHead(
      <g>
        <path d="M88 56Q102 28 108 -18Q130 6 154 54Z" fill="#6E72B8" {...ln} />
        <ellipse cx="120" cy="56" rx="58" ry="12" fill="#565A9E" {...ln} />
        <path d="M92 48Q120 56 150 46" fill="none" stroke="#F6D58A" strokeWidth="6" strokeLinecap="round" />
        <path d={star(116, 18, 8)} fill="#F6D58A" />
        <path d={star(134, 34, 6)} fill="#F6D58A" />
        <path d={star(104, 36, 4.5)} fill="#FFFDF5" />
      </g>,
      8,
    ),
  },
  korona: {
    head: onHead(
      <g>
        <path d="M84 62L78 24L102 42L120 12L138 42L162 24L156 62Z" fill="#F2C866" {...ln} />
        <path d="M86 54H154" stroke="#D9A441" strokeWidth="4" strokeLinecap="round" />
        <circle cx="78" cy="22" r="6" fill="#F2C866" {...ln} />
        <circle cx="120" cy="10" r="6" fill="#F2C866" {...ln} />
        <circle cx="162" cy="22" r="6" fill="#F2C866" {...ln} />
        <circle cx="120" cy="44" r="6" fill="#E07A7A" {...ln} />
        <circle cx="100" cy="50" r="4.5" fill="#7DB9E8" />
        <circle cx="140" cy="50" r="4.5" fill="#7FC79A" />
      </g>,
      6,
    ),
  },

  /* ── Okulary ────────────────────────────────────────── */
  okulary: {
    head: (
      <g fill="none" stroke="#8A5A3B" strokeWidth="6" strokeLinecap="round">
        <circle cx="92" cy="96" r="21" fill="#fff" fillOpacity=".2" />
        <circle cx="148" cy="96" r="21" fill="#fff" fillOpacity=".2" />
        <path d="M113 92Q120 84 127 92M71 92L54 86M169 92L186 86" />
      </g>
    ),
  },
  monokl: {
    head: (
      <g>
        <path d="M166 104Q186 126 172 150" fill="none" stroke="#D9A441" strokeWidth="2.5" strokeDasharray="4 3" />
        <circle cx="148" cy="96" r="21" fill="#fff" fillOpacity=".2" stroke="#D9A441" strokeWidth="6" />
      </g>
    ),
  },
  sloneczne: {
    head: (
      <g>
        {frame('#3A3F5C')}
        <rect x="66" y="80" width="50" height="32" rx="14" fill="#3A3F5C" />
        <rect x="124" y="80" width="50" height="32" rx="14" fill="#3A3F5C" />
        <path d="M76 90l12-3M134 90l12-3" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".75" />
      </g>
    ),
  },
  gogle: {
    head: (
      <g>
        <path d="M54 95H70M170 95H186" stroke="#4E9AA3" strokeWidth="9" strokeLinecap="round" />
        <path d="M112 94Q120 88 128 94" fill="none" stroke="#4E9AA3" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="92" cy="95" rx="23" ry="19" fill="#9BD3DA" fillOpacity=".45" stroke="#4E9AA3" strokeWidth="6" />
        <ellipse cx="148" cy="95" rx="23" ry="19" fill="#9BD3DA" fillOpacity=".45" stroke="#4E9AA3" strokeWidth="6" />
        <path d="M80 86q6-5 12-4M136 86q6-5 12-4" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    ),
  },
  gwiazdki: {
    head: (
      <g>
        {frame('#D9A441')}
        <path d={star(92, 97, 27)} fill="#F6D58A" fillOpacity=".55" stroke="#D9A441" strokeWidth="5" strokeLinejoin="round" />
        <path d={star(148, 97, 27)} fill="#F6D58A" fillOpacity=".55" stroke="#D9A441" strokeWidth="5" strokeLinejoin="round" />
      </g>
    ),
  },
  maska: {
    head: (
      <g>
        <path d="M60 92L44 82M60 98L46 110" stroke="#A94F4F" strokeWidth="6" strokeLinecap="round" />
        <path
          fillRule="evenodd"
          d={`M58 94Q64 72 92 74Q112 76 120 84Q128 76 148 74Q176 72 182 94Q180 118 150 118Q130 116 120 106Q110 116 90 118Q60 118 58 94Z${oval(92, 96, 13, 14)}${oval(148, 96, 13, 14)}`}
          fill="#E07A7A"
          {...ln}
        />
      </g>
    ),
  },
  serduszka: {
    head: (
      <g>
        <path d="M114 90Q120 84 126 90M68 88L54 82M172 88L186 82" fill="none" stroke="#C0587E" strokeWidth="6" strokeLinecap="round" />
        <path d={heart(92, 96, 22)} fill="#EC8CAB" fillOpacity=".55" stroke="#C0587E" strokeWidth="5" strokeLinejoin="round" />
        <path d={heart(148, 96, 22)} fill="#EC8CAB" fillOpacity=".55" stroke="#C0587E" strokeWidth="5" strokeLinejoin="round" />
      </g>
    ),
  },
  pilot: {
    head: (
      <g>
        <path d="M52 96H68M172 96H188" stroke="#8A5A3B" strokeWidth="12" strokeLinecap="round" />
        <path d="M112 95Q120 88 128 95" fill="none" stroke="#B07A4E" strokeWidth="7" strokeLinecap="round" />
        <circle cx="92" cy="96" r="22" fill="#BFDDF3" fillOpacity=".55" stroke="#8A5A3B" strokeWidth="8" />
        <circle cx="148" cy="96" r="22" fill="#BFDDF3" fillOpacity=".55" stroke="#8A5A3B" strokeWidth="8" />
        <circle cx="92" cy="96" r="22" fill="none" stroke="#D9A66E" strokeWidth="2.5" />
        <circle cx="148" cy="96" r="22" fill="none" stroke="#D9A66E" strokeWidth="2.5" />
      </g>
    ),
  },

  /* ── Na szyję ───────────────────────────────────────── */
  muszka: {
    head: (
      <g>
        <path d="M120 164L94 149Q87 164 94 179Z" fill="#E07A7A" {...ln} />
        <path d="M120 164L146 149Q153 164 146 179Z" fill="#E07A7A" {...ln} />
        <circle cx="100" cy="158" r="2.6" fill="#fff" />
        <circle cx="102" cy="170" r="2.6" fill="#fff" />
        <circle cx="140" cy="158" r="2.6" fill="#fff" />
        <circle cx="138" cy="170" r="2.6" fill="#fff" />
        <rect x="111" y="156" width="18" height="16" rx="6" fill="#C25B5B" {...ln} />
      </g>
    ),
  },
  krawat: {
    head: (
      <g>
        <path d="M113 168L127 168L134 204L120 216L106 204Z" fill="#7DB9E8" {...ln} />
        <path d="M112 182L130 176M110 196L132 188" stroke="#F6D58A" strokeWidth="4" />
        <path d="M110 154L130 154L127 170L113 170Z" fill="#5A8FC9" {...ln} />
      </g>
    ),
  },
  szalik: {
    head: (
      <g>
        {band('M136 162L130 206', '#7FC79A', 18)}
        <path d="M130 196l-1 8" stroke="#FFFDF5" strokeWidth="18" />
        {band('M52 134Q120 198 188 134', '#7FC79A', 20)}
        <path d="M52 134Q120 198 188 134" fill="none" stroke="#FFFDF5" strokeWidth="20" strokeDasharray="10 14" />
      </g>
    ),
  },
  apaszka: {
    head: (
      <g>
        <path d="M82 150Q120 168 158 150L120 196Z" fill="#E07A7A" {...ln} />
        {[
          [108, 166],
          [132, 166],
          [120, 180],
          [120, 162],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#fff" />
        ))}
        <circle cx="152" cy="152" r="6" fill="#C25B5B" {...ln} />
      </g>
    ),
  },
  korale: {
    head: (
      <g>
        {Array.from({ length: 13 }, (_, i) => {
          const t = i / 12
          const x = (1 - t) ** 2 * 80 + 2 * (1 - t) * t * 120 + t ** 2 * 160
          const y = (1 - t) ** 2 * 146 + 2 * (1 - t) * t * 192 + t ** 2 * 146
          return <circle key={i} cx={x} cy={y} r="6.5" fill={['#F2A7C0', '#FFFDF5', '#BBAEEC'][i % 3]} stroke={LINE} strokeWidth="2.5" />
        })}
      </g>
    ),
  },
  dzwonek: {
    head: (
      <g>
        {band('M52 144Q120 178 188 144', '#E07A7A', 9)}
        <path d="M108 186Q108 168 120 166Q132 168 132 186L136 190H104Z" fill="#F2C866" {...ln} />
        <circle cx="120" cy="192" r="4" fill="#D9A441" {...ln} />
      </g>
    ),
  },
  serduszko: {
    head: (
      <g>
        <path d="M84 146Q120 174 156 146" fill="none" stroke="#D9A441" strokeWidth="3" />
        <path d={heart(120, 176, 11)} fill="#EC8CAB" {...ln} />
        <path d="M114 172q2-4 6-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  medal: {
    head: (
      <g>
        {band('M100 146L117 182', '#7DB9E8', 9)}
        {band('M140 146L123 182', '#E07A7A', 9)}
        <circle cx="120" cy="192" r="15" fill="#F2C866" {...ln} />
        <path d={star(120, 192, 8)} fill="#D9A441" />
      </g>
    ),
  },

  /* ── Ubrania ────────────────────────────────────────── */
  paski: {
    body: (
      <g>
        {top('#7DB9E8', 214)}
        {[158, 176, 194].map((y) => (
          <path key={y} d={curve(y, 30, 210)} fill="none" stroke="#FFFDF5" strokeWidth="8" />
        ))}
        {hem(214)}
        {neckline}
      </g>
    ),
  },
  kamizelka: {
    body: (
      <g>
        <path d="M30 128H102L110 220Q70 226 30 212Z" fill="#C98A5E" stroke={LINE} strokeWidth="4" strokeLinejoin="round" />
        <path d="M210 128H138L130 220Q170 226 210 212Z" fill="#C98A5E" stroke={LINE} strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 136L106 214M140 136L134 214" stroke="#E3A87C" strokeWidth="3" strokeLinecap="round" />
        <circle cx="98" cy="176" r="3.5" fill="#8A5A3B" />
        <circle cx="100" cy="196" r="3.5" fill="#8A5A3B" />
        <path d="M70 192q8 3 16 0" fill="none" stroke="#8A5A3B" strokeWidth="3" strokeLinecap="round" />
        <path d="M154 192q8 3 16 0" fill="none" stroke="#8A5A3B" strokeWidth="3" strokeLinecap="round" />
      </g>
    ),
  },
  spodniczka: {
    over: (
      <g>
        <path d={skirt(198, 240, 38)} fill="#F2A7C0" {...ln} />
        <path d="M88 208L78 246M120 210V252M152 208L162 246" stroke="#D9789B" strokeWidth="3" strokeLinecap="round" />
        {waist(196, '#D9789B')}
      </g>
    ),
  },
  sweter: {
    body: (
      <g>
        {top('#F2A7C0', 220)}
        <path d={NECK} fill="none" stroke="#D9789B" strokeWidth="14" />
        <path d={curve(214, 30, 210)} fill="none" stroke="#D9789B" strokeWidth="12" />
        <path d={heart(120, 186, 13)} fill="#FFFDF5" stroke={LINE} strokeWidth="3" />
        {hem(220)}
        {neckline}
      </g>
    ),
  },
  tutu: {
    over: (
      <g>
        <path d="M46 206Q32 222 44 236Q62 230 76 242Q92 232 106 244Q120 232 134 244Q148 232 164 242Q178 230 196 236Q208 222 194 206Q120 222 46 206Z" fill="#F8C8D8" {...ln} />
        <path d="M58 208Q52 222 64 228Q82 222 96 232Q120 222 144 232Q158 222 176 228Q188 222 182 208Q120 222 58 208Z" fill="#FCE4EC" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
        {waist(200, '#D9789B')}
      </g>
    ),
  },
  sukienka: {
    body: (
      <g>
        {top('#BBAEEC', 214)}
        {neckline}
        {[
          [100, 168],
          [140, 168],
          [120, 184],
          [80, 186],
          [160, 186],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#FFFDF5" />
        ))}
      </g>
    ),
    over: (
      <g>
        <path d={skirt(194, 242, 36)} fill="#BBAEEC" {...ln} />
        {[
          [84, 228],
          [108, 218],
          [132, 232],
          [156, 220],
          [120, 244],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#FFFDF5" />
        ))}
        {waist(192, '#F6D58A')}
        {bow(150, 202, 0.6, '#F6D58A', '#D9A441')}
      </g>
    ),
  },
  ogrodniczki: {
    body: (
      <g>
        <path d={`M30 198Q120 212 210 198V262H30Z`} fill="#6F8FCF" />
        <path d={curve(198, 30, 96)} fill="none" stroke={LINE} strokeWidth="3" />
        <path d="M144 205Q178 202 210 198" fill="none" stroke={LINE} strokeWidth="3" />
        <path d="M120 212V250" stroke="#5878BC" strokeWidth="3" />
        <rect x="96" y="150" width="48" height="58" rx="8" fill="#6F8FCF" stroke={LINE} strokeWidth="3" />
        <path d="M100 152L82 128M140 152L158 128" stroke="#6F8FCF" strokeWidth="10" strokeLinecap="round" />
        <rect x="108" y="166" width="24" height="18" rx="4" fill="none" stroke="#B5CBEE" strokeWidth="2.5" strokeDasharray="4 3" />
        <circle cx="102" cy="158" r="4" fill="#F6D58A" stroke={LINE} strokeWidth="2" />
        <circle cx="138" cy="158" r="4" fill="#F6D58A" stroke={LINE} strokeWidth="2" />
      </g>
    ),
  },
  frak: {
    body: (
      <g>
        {shirt('#3A3F5C')}
        <path d="M98 142L120 214L142 142Q120 148 98 142Z" fill="#FFFDF5" />
        <path d="M100 136L112 176L96 168ZM140 136L128 176L144 168Z" fill="#4A5075" />
        {[176, 192, 206].map((y) => (
          <circle key={y} cx="120" cy={y} r="2.6" fill="#3A3F5C" />
        ))}
        <circle cx="96" cy="200" r="3" fill="#F2C866" />
        <circle cx="144" cy="200" r="3" fill="#F2C866" />
        {neckline}
      </g>
    ),
  },

  /* ── Buty ───────────────────────────────────────────── */
  trampki: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 22} 240Q${x - 22} 224 ${x} 224Q${x + 22} 224 ${x + 22} 240Z`} fill="#E07A7A" {...ln} />
        <rect x={x - 24} y="238" width="48" height="10" rx="5" fill="#FFFDF5" {...ln} />
        <path d={`M${x - 7} 230h14M${x - 8} 235h16`} stroke="#FFFDF5" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    )),
  },
  kalosze: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 16} 238V214Q${x - 16} 208 ${x - 10} 208H${x + 10}Q${x + 16} 208 ${x + 16} 214V236Q${x + 24} 238 ${x + 24} 244H${x - 24}Q${x - 24} 238 ${x - 16} 238Z`} fill="#F2C866" {...ln} />
        <path d={`M${x - 16} 216H${x + 16}`} stroke="#D9A441" strokeWidth="4" />
        <rect x={x - 25} y="242" width="50" height="7" rx="3.5" fill="#8A5A3B" {...ln} />
      </g>
    )),
  },
  baletki: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 8} 230L${x + 8} 216M${x + 8} 230L${x - 8} 216`} stroke="#F2A7C0" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx={x} cy="240" rx="21" ry="10" fill="#F8C8D8" {...ln} />
        <ellipse cx={x} cy="236" rx="11" ry="4" fill="#FCE4EC" />
        <circle cx={x} cy="231" r="3.5" fill="#D9789B" />
      </g>
    )),
  },
  pletwy: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 14} 226H${x + 14}L${x + 28} 252Q${x} 260 ${x - 28} 252Z`} fill="#7DB9E8" {...ln} />
        <path d={`M${x - 8} 234L${x - 14} 252M${x} 234V255M${x + 8} 234L${x + 14} 252`} stroke="#5A8FC9" strokeWidth="3" />
      </g>
    )),
  },
  kapcie: {
    feet: pair((x) => (
      <g>
        <ellipse cx={x - 8} cy="220" rx="5" ry="12" fill="#FFFDF5" {...ln} />
        <ellipse cx={x + 8} cy="220" rx="5" ry="12" fill="#FFFDF5" {...ln} />
        <ellipse cx={x - 8} cy="221" rx="2" ry="7" fill="#F8C8D8" />
        <ellipse cx={x + 8} cy="221" rx="2" ry="7" fill="#F8C8D8" />
        <ellipse cx={x} cy="238" rx="22" ry="12" fill="#FFFDF5" {...ln} />
        <circle cx={x - 6} cy="235" r="2" fill={LINE} />
        <circle cx={x + 6} cy="235" r="2" fill={LINE} />
        <circle cx={x} cy="240" r="2.6" fill="#F2A7C0" />
      </g>
    )),
  },
  kowbojki: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 15} 238L${x - 17} 208H${x + 17}L${x + 15} 236Q${x + 26} 238 ${x + 26} 246H${x - 22}Q${x - 24} 240 ${x - 15} 238Z`} fill="#B07A4E" {...ln} />
        <path d={`M${x - 8} 216Q${x} 228 ${x + 8} 216`} fill="none" stroke="#8A5A3B" strokeWidth="2.5" />
        <rect x={x - 22} y="244" width="10" height="7" fill="#8A5A3B" {...ln} />
      </g>
    )),
  },
  lyzwy: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 15} 238V212H${x + 15}V234Q${x + 24} 236 ${x + 24} 242H${x - 22}Q${x - 22} 238 ${x - 15} 238Z`} fill="#FFFDF5" {...ln} />
        <path d={`M${x - 7} 218h14M${x - 7} 225h14`} stroke="#BBAEEC" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M${x - 14} 242V250M${x + 14} 242V250`} stroke="#9AA2B8" strokeWidth="3" />
        <path d={`M${x - 24} 251H${x + 22}Q${x + 28} 251 ${x + 26} 245`} fill="none" stroke="#9AA2B8" strokeWidth="4" strokeLinecap="round" />
      </g>
    )),
  },
  wrotki: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 15} 238V214H${x + 15}V234Q${x + 24} 236 ${x + 24} 242H${x - 22}Q${x - 22} 238 ${x - 15} 238Z`} fill="#F2A7C0" {...ln} />
        <rect x={x - 22} y="240" width="46" height="6" rx="3" fill="#FFFDF5" {...ln} />
        <circle cx={x - 12} cy="251" r="5.5" fill="#F2C866" {...ln} />
        <circle cx={x + 12} cy="251" r="5.5" fill="#8ED3A6" {...ln} />
      </g>
    )),
  },

  /* ── Dodatki ────────────────────────────────────────── */
  balonik: {
    hand: (
      <g>
        <path d={`M58 124Q70 150 58 172Q50 190 ${HAND.x} ${HAND.y}`} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="58" cy="94" rx="23" ry="27" fill="#7DB9E8" {...ln} />
        <path d="M53 126L58 119L63 126Z" fill="#7DB9E8" {...ln} />
        <path d="M48 80Q52 72 60 72" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      </g>
    ),
  },
  kokardka: {
    tail: (
      <g>
        <path d="M208 196L190 184Q186 196 190 208Z" fill="#F2A7C0" {...ln} />
        <path d="M208 196L226 184Q230 196 226 208Z" fill="#F2A7C0" {...ln} />
        <circle cx="208" cy="196" r="6" fill="#D9789B" {...ln} />
      </g>
    ),
  },
  plecak: {
    back: (
      <g>
        <rect x="52" y="146" width="136" height="80" rx="22" fill="#E8857C" {...ln} />
        <rect x="40" y="176" width="20" height="36" rx="8" fill="#CF6A62" {...ln} />
        <rect x="180" y="176" width="20" height="36" rx="8" fill="#CF6A62" {...ln} />
      </g>
    ),
    over: (
      <g>
        {band('M90 150L86 206', '#CF6A62', 8)}
        {band('M150 150L154 206', '#CF6A62', 8)}
        <rect x="80" y="182" width="12" height="9" rx="2" fill="#F2C866" {...ln} strokeWidth="2.5" />
        <rect x="148" y="182" width="12" height="9" rx="2" fill="#F2C866" {...ln} strokeWidth="2.5" />
      </g>
    ),
  },
  torebka: {
    hand: (
      <g>
        <path d={`M44 214Q${HAND.x - 4} 186 ${HAND.x + 14} 214`} fill="none" stroke="#C0587E" strokeWidth="4" strokeLinecap="round" />
        <rect x="36" y="210" width="46" height="34" rx="10" fill="#F2A7C0" {...ln} />
        <path d="M36 222H82" stroke={LINE} strokeWidth="3" />
        <path d={heart(59, 232, 6)} fill="#FFFDF5" />
      </g>
    ),
  },
  parasolka: {
    hand: (
      <g transform="translate(63 200) scale(0.8) translate(-63 -200)">
        <path d={`M${HAND.x} ${HAND.y}L40 96`} stroke="#8A5A3B" strokeWidth="4" strokeLinecap="round" />
        <path d={`M${HAND.x} ${HAND.y}q6 10-2 12`} fill="none" stroke="#8A5A3B" strokeWidth="4" strokeLinecap="round" />
        <path d="M-4 104Q-2 58 40 54Q82 58 84 104Q74 94 62 104Q52 94 40 104Q28 94 18 104Q8 94 -4 104Z" fill="#BBAEEC" {...ln} />
        <path d="M40 56Q30 80 18 104M40 56Q50 80 62 104" fill="none" stroke={LINE} strokeWidth="2.5" />
        <circle cx="40" cy="52" r="4" fill="#F2C866" {...ln} strokeWidth="2.5" />
      </g>
    ),
  },
  rozdzka: {
    hand: (
      <g>
        <path d={`M${HAND.x - 2} ${HAND.y + 6}L56 150`} stroke="#3A3F5C" strokeWidth="6" strokeLinecap="round" />
        <path d={`M${HAND.x - 6} ${HAND.y - 2}L64 182`} stroke="#FFFDF5" strokeWidth="6" strokeLinecap="round" />
        <path d={star(54, 142, 15)} fill="#F6D58A" {...ln} />
        <path d={star(34, 118, 5)} fill="#F6D58A" />
        <path d={star(76, 116, 4)} fill="#F6D58A" />
      </g>
    ),
  },
  skrzydla: {
    back: (
      <g transform="translate(120 160) scale(1.3) translate(-120 -160)">
        <path d="M100 160Q40 90 22 120Q8 160 70 176Q30 190 46 222Q70 236 104 192Z" fill="#BBAEEC" {...ln} />
        <path d="M140 160Q200 90 218 120Q232 160 170 176Q210 190 194 222Q170 236 136 192Z" fill="#BBAEEC" {...ln} />
        {[
          [44, 132, 9, '#F2A7C0'],
          [196, 132, 9, '#F2A7C0'],
          [60, 208, 6, '#F6D58A'],
          [180, 208, 6, '#F6D58A'],
          [30, 150, 5, '#FFFDF5'],
          [210, 150, 5, '#FFFDF5'],
        ].map(([x, y, r, c], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={c as string} />
        ))}
      </g>
    ),
  },
  peleryna: {
    back: <path d="M80 142Q56 200 42 244Q120 258 198 244Q184 200 160 142Z" fill="#E07A7A" {...ln} />,
    head: (
      <g>
        {band('M52 144Q120 178 188 144', '#E07A7A', 10)}
        <circle cx="120" cy="162" r="8" fill="#F2C866" {...ln} />
      </g>
    ),
  },
  /* ── Nowe: dla dziewczynek i na wesoło ──────────────── */
  spinki: {
    head: (
      <g>
        <path d="M70 78L88 70" stroke="#C0587E" strokeWidth="4" strokeLinecap="round" />
        <path d={heart(76, 78, 9)} fill="#EC8CAB" {...ln} strokeWidth="3" />
        <path d="M84 64L102 58" stroke="#C0587E" strokeWidth="4" strokeLinecap="round" />
        <path d={heart(92, 62, 8)} fill="#BBAEEC" {...ln} strokeWidth="3" />
        <path d="M72 75q2-3 5-3M88 59q2-3 5-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  kurczak: {
    head: (
      <g>
        {band('M90 62Q120 72 150 62', '#C98A5E', 9)}
        <path d="M94 58l6 8M106 61l4 8M134 61l-4 8M146 58l-6 8" stroke="#8A5A3B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M120 58c-18 0-24-10-24-22 0-14 10-24 24-24s24 10 24 24c0 12-6 22-24 22z" fill="#F6D58A" {...ln} />
        <path d="M118 12c-2-8 4-12 8-8-4 0-5 4-4 8" fill="#F6D58A" {...ln} strokeWidth="3" />
        <path d="M100 38c-6 2-10 8-8 14 6 0 10-4 12-8" fill="#F2C866" {...ln} strokeWidth="3" />
        <circle cx="112" cy="30" r="3" fill={LINE} />
        <circle cx="128" cy="30" r="3" fill={LINE} />
        <path d="M114 37h12l-6 7z" fill="#F0A35E" {...ln} strokeWidth="2.5" />
        <circle cx="106" cy="38" r="3.5" fill="#F7B7C5" />
        <circle cx="134" cy="38" r="3.5" fill="#F7B7C5" />
      </g>
    ),
  },
  jednorozec: {
    head: (
      <g>
        {band('M74 74Q120 34 166 74', '#F2A7C0', 6)}
        <path d="M108 56L121 2L134 56Q121 62 108 56Z" fill="#F6D58A" {...ln} />
        <path d="M112 44L130 38M114 32L128 27M117 20L126 16" stroke="#D9A441" strokeWidth="3" strokeLinecap="round" />
        {flower(98, 58, 5, '#BBAEEC', 'a')}
        {flower(144, 58, 5, '#7DB9E8', 'b')}
        {flower(86, 66, 4, '#FFFDF5', 'c')}
        {flower(156, 66, 4, '#F2A7C0', 'd')}
      </g>
    ),
  },
  tiara: {
    head: onHead(
      <g>
        <path d="M80 70Q120 52 160 70L156 58L142 62L136 44L128 56L120 30L112 56L104 44L98 62L84 58Z" fill="#E6E2F4" {...ln} />
        <path d="M86 66Q120 52 154 66" fill="none" stroke="#C9C2E6" strokeWidth="3" />
        <path d={heart(120, 46, 6)} fill="#EC8CAB" {...ln} strokeWidth="2.5" />
        <circle cx="104" cy="54" r="3.5" fill="#7DB9E8" {...ln} strokeWidth="2" />
        <circle cx="136" cy="54" r="3.5" fill="#7DB9E8" {...ln} strokeWidth="2" />
        <path d={star(120, 22, 5)} fill="#F6D58A" />
        <path d={star(150, 40, 3.5)} fill="#F6D58A" />
      </g>,
      4,
      1.2,
    ),
  },
  rzesy: {
    head: (
      <g fill="none" stroke={LINE} strokeWidth="3.2" strokeLinecap="round">
        <path d="M85 91L78 85M89 89.5L86 82M83 95L75 92" />
        <path d="M155 91L162 85M151 89.5L154 82M157 95L165 92" />
      </g>
    ),
  },
  kwiatki: {
    head: (
      <g>
        {frame('#F2C866')}
        {[92, 148].map((cx) => (
          <g key={cx}>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (Math.PI * 2 * i) / 10
              return <ellipse key={i} cx={cx + Math.cos(a) * 23} cy={96 + Math.sin(a) * 23} rx="7" ry="5.5" transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * 23} ${96 + Math.sin(a) * 23})`} fill="#FFFDF5" stroke={LINE} strokeWidth="2" />
            })}
            <circle cx={cx} cy="96" r="17" fill="#FCE9A8" fillOpacity=".35" stroke="#F2C866" strokeWidth="5" />
          </g>
        ))}
      </g>
    ),
  },
  kotki: {
    head: (
      <g>
        {frame('#C0587E')}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? 'translate(240 0) scale(-1 1)' : undefined}>
            <path d="M66 80L78 88Q94 80 112 90Q114 112 92 113Q70 112 70 96Z" fill="#F2A7C0" fillOpacity=".4" stroke="#C0587E" strokeWidth="5" strokeLinejoin="round" />
            <path d={star(64, 76, 5)} fill="#F6D58A" />
          </g>
        ))}
      </g>
    ),
  },
  wasy: {
    head: (
      <g>
        <path d="M74 76Q92 66 108 76M132 76Q148 66 166 76" fill="none" stroke="#5B3A29" strokeWidth="8" strokeLinecap="round" />
        {frame('#3A3F5C')}
        <circle cx="92" cy="96" r="18" fill="#fff" fillOpacity=".2" stroke="#3A3F5C" strokeWidth="6" />
        <circle cx="148" cy="96" r="18" fill="#fff" fillOpacity=".2" stroke="#3A3F5C" strokeWidth="6" />
        <path d="M120 128Q108 120 94 126Q88 134 78 128Q84 142 104 138Q114 136 120 132Q126 136 136 138Q156 142 162 128Q152 134 146 126Q132 120 120 128Z" fill="#5B3A29" {...ln} strokeWidth="3" />
        <ellipse cx="120" cy="114" rx="13" ry="11" fill="#F2A7C0" {...ln} />
        <path d="M113 110q3-4 7-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  perelki: {
    head: (
      <g>
        {Array.from({ length: 15 }, (_, i) => {
          const t = i / 14
          const x = (1 - t) ** 2 * 82 + 2 * (1 - t) * t * 120 + t ** 2 * 158
          const y = (1 - t) ** 2 * 148 + 2 * (1 - t) * t * 190 + t ** 2 * 148
          return <circle key={i} cx={x} cy={y} r={i === 7 ? 7 : 5} fill={i === 7 ? '#F8C8D8' : '#FFFDF5'} stroke={LINE} strokeWidth="2.2" />
        })}
        <circle cx="117.5" cy="166" r="1.8" fill="#fff" />
      </g>
    ),
  },
  kolnierzyk: {
    head: (
      <g>
        {Array.from({ length: 9 }, (_, i) => {
          const t = i / 8
          const x = (1 - t) ** 2 * 66 + 2 * (1 - t) * t * 120 + t ** 2 * 174
          const y = (1 - t) ** 2 * 142 + 2 * (1 - t) * t * 168 + t ** 2 * 142
          return <circle key={i} cx={x} cy={y} r="11" fill="#FFFDF5" stroke={LINE} strokeWidth="3" />
        })}
        {bow(120, 156, 0.7, '#F2A7C0', '#D9789B')}
      </g>
    ),
  },
  boa: {
    head: (
      <g>
        {(['outline', 'fill'] as const).map((pass) => (
          <g key={pass}>
            {[...Array.from({ length: 14 }, (_, i) => {
              const t = i / 13
              return [(1 - t) ** 2 * 54 + 2 * (1 - t) * t * 120 + t ** 2 * 186, (1 - t) ** 2 * 136 + 2 * (1 - t) * t * 196 + t ** 2 * 136]
            }), [172, 160], [168, 176], [164, 192], [160, 208]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={pass === 'outline' ? 10.5 : 8} fill={pass === 'outline' ? LINE : i % 2 ? '#F8C8D8' : '#F2A7C0'} />
            ))}
          </g>
        ))}
      </g>
    ),
  },
  sliniak: {
    head: (
      <g>
        <path d="M84 146Q120 160 156 146Q164 204 120 206Q76 204 84 146Z" fill="#FFFDF5" {...ln} />
        <path d="M90 156Q120 168 150 156Q154 196 120 198Q86 196 90 156Z" fill="none" stroke="#F2A7C0" strokeWidth="2.5" strokeDasharray="5 4" />
        <ellipse cx="124" cy="188" rx="14" ry="9" fill="#F6D58A" {...ln} strokeWidth="2.5" />
        <circle cx="112" cy="176" r="8" fill="#F6D58A" {...ln} strokeWidth="2.5" />
        <path d="M104 176l-7 2 7 3z" fill="#F0A35E" stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="111" cy="174" r="1.6" fill={LINE} />
        <path d="M84 148L76 140M156 148L164 140" stroke="#F2A7C0" strokeWidth="4" strokeLinecap="round" />
      </g>
    ),
  },
  teczowa: {
    body: (
      <g>
        {top('#E6E0FA', 222)}
        {['#E8857C', '#F6D58A', '#8ED3A6', '#7DB9E8'].map((c, i) => (
          <path key={c} d={`M${96 + i * 6} 202a${24 - i * 6} ${24 - i * 6} 0 0 1 ${48 - i * 12} 0`} fill="none" stroke={c} strokeWidth="6" />
        ))}
        <circle cx="92" cy="202" r="7" fill="#FFFDF5" stroke={LINE} strokeWidth="2" />
        <circle cx="100" cy="204" r="6" fill="#FFFDF5" stroke={LINE} strokeWidth="2" />
        <circle cx="142" cy="204" r="6" fill="#FFFDF5" stroke={LINE} strokeWidth="2" />
        <circle cx="149" cy="202" r="7" fill="#FFFDF5" stroke={LINE} strokeWidth="2" />
        {hem(222)}
        {neckline}
      </g>
    ),
  },
  fartuszek: {
    over: (
      <g>
        <path d="M92 160Q120 118 148 160" fill="none" stroke="#F2A7C0" strokeWidth="4" />
        <path d="M84 196H58M156 196H182" stroke="#F2A7C0" strokeWidth="4" strokeLinecap="round" />
        <path d="M88 158H152L156 230H84Z" fill="#FFFDF5" {...ln} />
        {[90, 101, 112, 123, 134, 145].map((x) => (
          <circle key={x} cx={x + 5} cy="232" r="6" fill="#F8C8D8" stroke={LINE} strokeWidth="2.5" />
        ))}
        <path d="M84 230H156" stroke="#FFFDF5" strokeWidth="4" />
        <path d="M108 198H132L128 216H112Z" fill="#F2A7C0" {...ln} strokeWidth="2.5" />
        <path d="M106 199Q106 184 120 184Q134 184 134 199Z" fill="#FFFDF5" {...ln} strokeWidth="2.5" />
        <circle cx="120" cy="181" r="4" fill="#E07A7A" {...ln} strokeWidth="2" />
        <path d="M112 192h2M124 190h2M118 195h2" stroke="#7DB9E8" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    ),
  },
  kolo: {
    over: (
      <g>
        <ellipse cx="120" cy="204" rx="80" ry="20" fill="none" stroke={LINE} strokeWidth="30" />
        <ellipse cx="120" cy="204" rx="80" ry="20" fill="none" stroke="#F6D58A" strokeWidth="22" />
        <ellipse cx="120" cy="204" rx="80" ry="20" fill="none" stroke="#E8857C" strokeWidth="22" strokeDasharray="22 40" />
        <circle cx="42" cy="180" r="15" fill="#F6D58A" {...ln} />
        <path d="M28 180l-12 2 12 5z" fill="#F0A35E" {...ln} strokeWidth="2.5" />
        <circle cx="38" cy="176" r="2.6" fill={LINE} />
        <circle cx="44" cy="184" r="3" fill="#F7B7C5" />
      </g>
    ),
  },
  ksiezniczka: {
    body: (
      <g>
        {shirt('#F8C8D8')}
        <path d="M98 144Q120 160 142 144" fill="none" stroke="#FFFDF5" strokeWidth="5" />
        <path d={star(120, 170, 6)} fill="#F6D58A" />
        {neckline}
      </g>
    ),
    over: (
      <g>
        <path d="M54 188Q120 202 186 188Q214 236 214 250Q120 268 26 250Q26 236 54 188Z" fill="#F2A7C0" {...ln} />
        <path d="M100 196Q92 226 84 256M140 196Q148 226 156 256" fill="none" stroke="#E58FB0" strokeWidth="3" />
        <path d="M100 196H140Q150 228 156 256Q120 262 84 256Q90 228 100 196Z" fill="#FCE4EC" />
        {[
          [70, 230],
          [170, 230],
          [120, 222],
          [104, 244],
          [138, 244],
        ].map(([x, y], i) => (
          <path key={i} d={star(x, y, 4)} fill="#F6D58A" />
        ))}
        {waist(184, '#F6D58A')}
        <path d={heart(120, 192, 6)} fill="#EC8CAB" {...ln} strokeWidth="2" />
      </g>
    ),
  },
  skarpetki: {
    feet: (
      <g>
        {[
          [94, '#F2A7C0', '#FFFDF5'],
          [146, '#7DB9E8', '#F6D58A'],
        ].map(([x, c, d], k) => {
          const cx = x as number
          return (
            <g key={k}>
              <path d={`M${cx - 15} 242V206Q${cx - 15} 202 ${cx - 11} 202H${cx + 11}Q${cx + 15} 202 ${cx + 15} 206V234Q${cx + 23} 236 ${cx + 22} 244Q${cx} 250 ${cx - 20} 246Z`} fill={c as string} {...ln} />
              {k === 0
                ? [212, 222, 232].map((y) => <path key={y} d={`M${cx - 15} ${y}H${cx + 15}`} stroke={d as string} strokeWidth="4" />)
                : [
                    [cx - 6, 212],
                    [cx + 6, 222],
                    [cx - 4, 232],
                    [cx + 12, 240],
                  ].map(([px, py], i) => <circle key={i} cx={px} cy={py} r="3" fill={d as string} />)}
              <rect x={cx - 17} y="200" width="34" height="8" rx="4" fill={c as string} {...ln} strokeWidth="3" />
            </g>
          )
        })}
      </g>
    ),
  },
  pantofelki: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 21} 240Q${x - 21} 226 ${x} 226Q${x + 22} 226 ${x + 23} 242Q${x} 250 ${x - 21} 244Z`} fill="#BBAEEC" {...ln} />
        <path d={`M${x - 12} 230Q${x} 236 ${x + 12} 230`} fill="none" stroke={LINE} strokeWidth="3" />
        <path d={heart(x + 2, 236, 4.5)} fill="#EC8CAB" />
        {[
          [-12, 240],
          [12, 240],
          [-4, 244],
        ].map(([dx, y], i) => (
          <circle key={i} cx={x + dx} cy={y} r="1.6" fill="#fff" />
        ))}
      </g>
    )),
  },
  kozaczki: {
    feet: pair((x) => (
      <g>
        <path d={`M${x - 15} 240V214H${x + 15}V234Q${x + 23} 236 ${x + 23} 244H${x - 21}Q${x - 22} 240 ${x - 15} 240Z`} fill="#E8B4A0" {...ln} />
        {[-12, -4, 4, 12].map((dx) => (
          <circle key={`o${dx}`} cx={x + dx} cy="212" r="7.5" fill={LINE} />
        ))}
        {[-12, -4, 4, 12].map((dx) => (
          <circle key={dx} cx={x + dx} cy="212" r="5.5" fill="#FFFDF5" />
        ))}
        <circle cx={x + 2} cy="228" r="3" fill="#F2A7C0" />
      </g>
    )),
  },
  klaun: {
    feet: (
      <g>
        {[
          [80, -1],
          [160, 1],
        ].map(([cx, dir]) => (
          <g key={cx}>
            <path d={`M${cx - 30} 244Q${cx - 30} 226 ${cx} 226Q${cx + 30} 226 ${cx + 30} 244Q${cx} 254 ${cx - 30} 244Z`} fill="#E8857C" {...ln} />
            <circle cx={cx + dir * 20} cy="236" r="7" fill="#F2C866" {...ln} strokeWidth="2.5" />
            <path d={`M${cx - 8 - dir * 8} 230l8 6 8-6`} fill="none" stroke="#7DB9E8" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
      </g>
    ),
  },
  lizak: {
    hand: (
      <g>
        <path d={`M${HAND.x} ${HAND.y}L50 128`} stroke={LINE} strokeWidth="9" strokeLinecap="round" />
        <path d={`M${HAND.x} ${HAND.y}L50 128`} stroke="#FFFDF5" strokeWidth="4" strokeLinecap="round" />
        <circle cx="48" cy="108" r="24" fill="#F2A7C0" {...ln} />
        <path d="M48 108m0-2a3 3 0 1 1-3 4a7 7 0 1 1 10-6a11 11 0 1 1-17-2a15 15 0 1 1 22 16" fill="none" stroke="#FFFDF5" strokeWidth="4" strokeLinecap="round" />
        {bow(54, 132, 0.45, '#BBAEEC', '#9686D6')}
      </g>
    ),
  },
  lody: {
    hand: (
      <g>
        <path d={`M48 170H78L${HAND.x} ${HAND.y + 6}Z`} fill="#E3B27A" {...ln} />
        <path d="M54 178l18 10M70 176l-14 14" stroke="#C98A5E" strokeWidth="2.5" />
        <circle cx="54" cy="162" r="12" fill="#F2A7C0" {...ln} />
        <circle cx="72" cy="162" r="12" fill="#8ED3A6" {...ln} />
        <circle cx="63" cy="146" r="12" fill="#FFF3D6" {...ln} />
        <circle cx="64" cy="132" r="5" fill="#E07A7A" {...ln} strokeWidth="2.5" />
        <path d="M58 150h2M66 154h2M62 142h2" stroke="#7DB9E8" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    ),
  },
  banki: {
    hand: (
      <g>
        <path d={`M${HAND.x} ${HAND.y}L54 150`} stroke="#BBAEEC" strokeWidth="5" strokeLinecap="round" />
        <circle cx="50" cy="140" r="11" fill="none" stroke="#BBAEEC" strokeWidth="5" />
        {[
          [28, 108, 13],
          [60, 98, 8],
          [20, 74, 7],
          [48, 66, 10],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill="#BFE3F6" fillOpacity=".35" stroke="#7DB9E8" strokeWidth="2.5" />
            <path d={`M${x - r * 0.5} ${y - r * 0.2}q${r * 0.1}-${r * 0.4} ${r * 0.5}-${r * 0.5}`} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        ))}
      </g>
    ),
  },
  mis: {
    // A teddy dangling from the paw by one arm, the way a child carries one.
    hand: (
      <g>
        <path d={`M${HAND.x} ${HAND.y}L56 214`} stroke={LINE} strokeWidth="13" strokeLinecap="round" />
        <path d={`M${HAND.x} ${HAND.y}L56 214`} stroke="#C98A5E" strokeWidth="6" strokeLinecap="round" />
        <circle cx="38" cy="214" r="6.5" fill="#C98A5E" {...ln} strokeWidth="3" />
        <circle cx="62" cy="212" r="6.5" fill="#C98A5E" {...ln} strokeWidth="3" />
        <ellipse cx="50" cy="248" rx="15" ry="14" fill="#C98A5E" {...ln} strokeWidth="3" />
        <ellipse cx="50" cy="250" rx="8" ry="7.5" fill="#F2D7B6" />
        <circle cx="50" cy="226" r="15" fill="#C98A5E" {...ln} strokeWidth="3" />
        <ellipse cx="50" cy="231" rx="6.5" ry="5" fill="#F2D7B6" />
        <ellipse cx="50" cy="229" rx="2.6" ry="2" fill={LINE} />
        <circle cx="44" cy="223" r="2" fill={LINE} />
        <circle cx="56" cy="223" r="2" fill={LINE} />
        <circle cx="38" cy="214" r="2.6" fill="#F2D7B6" />
        <circle cx="62" cy="212" r="2.6" fill="#F2D7B6" />
        {bow(50, 240, 0.4, '#E07A7A', '#C25B5B')}
      </g>
    ),
  },

  kotek: {
    back: (
      <g>
        <path d="M58 150L52 120L76 138Z" fill="#BBAEEC" {...ln} />
        <path d="M182 150L188 120L164 138Z" fill="#BBAEEC" {...ln} />
        <path d="M60 140L57 127L68 136Z" fill="#F7B7C5" />
        <path d="M180 140L183 127L172 136Z" fill="#F7B7C5" />
        <rect x="50" y="136" width="140" height="92" rx="30" fill="#BBAEEC" {...ln} />
        <rect x="38" y="178" width="20" height="34" rx="9" fill="#9C8FD0" {...ln} />
        <rect x="182" y="178" width="20" height="34" rx="9" fill="#9C8FD0" {...ln} />
      </g>
    ),
    over: (
      <g>
        {band('M90 148L86 204', '#9C8FD0', 8)}
        {band('M150 148L154 204', '#9C8FD0', 8)}
        <circle cx="87" cy="186" r="6" fill="#F2A7C0" {...ln} strokeWidth="2.5" />
        <circle cx="153" cy="186" r="6" fill="#F2A7C0" {...ln} strokeWidth="2.5" />
      </g>
    ),
  },
  zolw: {
    back: (
      <g>
        <ellipse cx="120" cy="186" rx="84" ry="64" fill="#7FC79A" {...ln} />
        <path d="M36 186Q120 222 204 186" fill="none" stroke="#5E9C76" strokeWidth="10" />
        {[
          [44, 160],
          [196, 160],
          [40, 206],
          [200, 206],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x - 7} ${y}l7-7 7 7-7 7z`} fill="#A8D8B8" stroke="#5E9C76" strokeWidth="2.5" strokeLinejoin="round" />
        ))}
      </g>
    ),
    over: (
      <g>
        {band('M88 146L82 204', '#5E9C76', 7)}
        {band('M152 146L158 204', '#5E9C76', 7)}
      </g>
    ),
  },
  wrozka: {
    back: (
      <g>
        {[0, 1].map((m) => (
          <g key={m} transform={m ? 'translate(240 0) scale(-1 1)' : undefined}>
            <path d="M104 156Q60 70 26 92Q6 116 44 146Q70 162 104 166Z" fill="#CBE3F6" fillOpacity=".85" {...ln} />
            <path d="M104 172Q70 176 50 204Q44 226 66 224Q92 216 106 180Z" fill="#F8D3E0" fillOpacity=".85" {...ln} />
            <path d="M96 156Q60 110 38 108M98 176Q76 196 64 212" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            <path d={star(46, 120, 5)} fill="#F6D58A" />
            <circle cx="72" cy="206" r="3" fill="#fff" />
          </g>
        ))}
      </g>
    ),
  },
  rakieta: {
    back: (
      <g>
        {[0, 1].map((m) => (
          <g key={m} transform={m ? 'translate(240 0) scale(-1 1)' : undefined}>
            <path d="M44 218Q36 238 44 252Q52 238 44 218Z" fill="#F6D58A" stroke="#F0A35E" strokeWidth="3" strokeLinejoin="round" />
            <path d="M32 214L24 228L36 222ZM56 214L64 228L52 222Z" fill="#E8857C" {...ln} strokeWidth="3" />
            <path d="M32 220V170Q32 146 44 136Q56 146 56 170V220Z" fill="#FFFDF5" {...ln} />
            <path d="M32 172H56" stroke="#E8857C" strokeWidth="6" />
            <circle cx="44" cy="190" r="6" fill="#7DB9E8" {...ln} strokeWidth="2.5" />
          </g>
        ))}
      </g>
    ),
    over: (
      <g>
        {band('M88 148L84 204', '#9AA0B2', 7)}
        {band('M152 148L156 204', '#9AA0B2', 7)}
      </g>
    ),
  },
}

/** Everything worn on one layer, for Smoczek to draw. Clothes on the body are clipped to its shape. */
export function OutfitLayer({ outfit, layer, clipId }: { outfit?: Outfit; layer: Layer; clipId?: string }) {
  if (!outfit?.length) return null
  const parts = outfit.map((id) => [id, GADGET_ART[id]?.[layer]] as [string, ReactNode]).filter((p) => !!p[1])
  if (!parts.length) return null
  if (layer === 'body' && clipId) {
    return (
      <>
        <g clipPath={`url(#${clipId})`}>
          {parts.map(([id, art]) => (
            <g key={id}>{art}</g>
          ))}
        </g>
        <path d={BEAN} fill="none" stroke={LINE} strokeWidth={W} strokeLinejoin="round" />
      </>
    )
  }
  return (
    <>
      {parts.map(([id, art]) => (
        <g key={id}>{art}</g>
      ))}
    </>
  )
}

/** The clip path that keeps clothes on the tummy. Put it in the svg's <defs>. */
export function BodyClip({ id }: { id: string }) {
  return (
    <clipPath id={id}>
      <path d={BEAN} />
    </clipPath>
  )
}

const LAYER_ORDER: Layer[] = ['back', 'tail', 'feet', 'body', 'over', 'hand', 'head']

/** A gadget on its own, for the shop shelf. Clothes and shoes sit on a pale silhouette so they read as worn. */
export function GadgetPicture({ id, size = 96 }: { id: string; size?: number | string }) {
  const art = GADGET_ART[id]
  const g = gadgetById(id)
  const clip = useId().replace(/:/g, '')
  const group = useRef<SVGGElement>(null)
  const [box, setBox] = useState('0 0 240 260')
  useLayoutEffect(() => {
    try {
      const b = group.current?.getBBox()
      if (b && b.width) {
        const side = Math.max(b.width, b.height) + 10
        setBox(`${b.x + b.width / 2 - side / 2} ${b.y + b.height / 2 - side / 2} ${side} ${side}`)
      }
    } catch {
      /* not rendered yet (e.g. hidden); keep the full box */
    }
  }, [id])
  if (!art || !g) return null
  const ghost = g.slot === 'body' || g.slot === 'feet'
  return (
    <svg viewBox={box} width={size} height={size} role="img" aria-label={g.name} style={{ overflow: 'visible', ['--ink' as string]: '#2E2A33' }}>
      <defs>
        <BodyClip id={clip} />
      </defs>
      <g ref={group}>
        {ghost && g.slot === 'feet' && FEET.map((x) => <ellipse key={x} cx={x} cy="240" rx="18" ry="10" fill="#EEF0F6" />)}
        {ghost && g.slot === 'body' && <path d={BEAN} fill="#EEF0F6" />}
        {LAYER_ORDER.map((layer) =>
          art[layer] ? <OutfitLayer key={layer} outfit={[id]} layer={layer} clipId={layer === 'body' ? clip : undefined} /> : null,
        )}
      </g>
    </svg>
  )
}
