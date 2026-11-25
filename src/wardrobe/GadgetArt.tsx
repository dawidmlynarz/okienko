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

type Art = Partial<Record<Layer, ReactNode>>

export const GADGET_ART: Record<string, Art> = {
  /* ── Czapki ─────────────────────────────────────────── */
  kokarda: { head: bow(146, 50, 1.25, '#EC8CAB', '#C0587E') },
  czapka: {
    head: (
      <g>
        <path d="M80 60C78 14 162 14 160 60Z" fill="#E8857C" {...ln} />
        <path d="M102 26v26M120 20v32M138 26v26" stroke="#F8C4BC" strokeWidth="5" strokeLinecap="round" />
        <rect x="72" y="50" width="96" height="18" rx="9" fill="#FFFDF5" {...ln} />
        <circle cx="120" cy="14" r="11" fill="#FFFDF5" {...ln} />
      </g>
    ),
  },
  daszek: {
    head: (
      <g>
        <path d="M148 58Q186 54 200 64Q176 74 148 68Z" fill="#5A8FC9" {...ln} />
        <path d="M80 62C78 22 162 22 160 62Z" fill="#7DB9E8" {...ln} />
        <path d="M120 24V60M98 30Q104 46 102 60M142 30Q136 46 138 60" fill="none" stroke="#5A8FC9" strokeWidth="3" />
        <circle cx="120" cy="24" r="5" fill="#5A8FC9" {...ln} />
        <path d={star(120, 46, 8)} fill="#F6D58A" />
      </g>
    ),
  },
  urodzinowa: {
    head: (
      <g transform="rotate(10 121 58)">
        <path d="M96 60L121 0L146 60Q121 68 96 60Z" fill="#BBAEEC" {...ln} />
        <circle cx="114" cy="44" r="4.5" fill="#F6D58A" />
        <circle cx="130" cy="34" r="4" fill="#F2A7C0" />
        <circle cx="124" cy="52" r="4" fill="#8ED3A6" />
        <circle cx="120" cy="22" r="3.5" fill="#F6D58A" />
        <circle cx="121" cy="0" r="8" fill="#F2A7C0" {...ln} />
      </g>
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
    head: (
      <g>
        <path d="M90 56Q86 18 104 20Q120 30 136 20Q154 18 150 56Z" fill="#C98A5E" {...ln} />
        <path d="M90 46Q120 54 150 46" fill="none" stroke="#8A5A3B" strokeWidth="7" />
        <path d="M60 52Q66 64 120 66Q174 64 180 52Q184 66 170 70Q120 82 70 70Q56 66 60 52Z" fill="#B07A4E" {...ln} />
        <path d={star(138, 48, 5)} fill="#F6D58A" />
      </g>
    ),
  },
  czarodziej: {
    head: (
      <g>
        <path d="M88 56Q102 28 108 -18Q130 6 154 54Z" fill="#6E72B8" {...ln} />
        <ellipse cx="120" cy="56" rx="58" ry="12" fill="#565A9E" {...ln} />
        <path d="M92 48Q120 56 150 46" fill="none" stroke="#F6D58A" strokeWidth="6" strokeLinecap="round" />
        <path d={star(116, 18, 8)} fill="#F6D58A" />
        <path d={star(134, 34, 6)} fill="#F6D58A" />
        <path d={star(104, 36, 4.5)} fill="#FFFDF5" />
      </g>
    ),
  },
  korona: {
    head: (
      <g>
        <path d="M84 62L78 24L102 42L120 12L138 42L162 24L156 62Z" fill="#F2C866" {...ln} />
        <path d="M86 54H154" stroke="#D9A441" strokeWidth="4" strokeLinecap="round" />
        <circle cx="78" cy="22" r="6" fill="#F2C866" {...ln} />
        <circle cx="120" cy="10" r="6" fill="#F2C866" {...ln} />
        <circle cx="162" cy="22" r="6" fill="#F2C866" {...ln} />
        <circle cx="120" cy="44" r="6" fill="#E07A7A" {...ln} />
        <circle cx="100" cy="50" r="4.5" fill="#7DB9E8" />
        <circle cx="140" cy="50" r="4.5" fill="#7FC79A" />
      </g>
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
        <rect x="44" y="130" width="152" height="82" fill="#7DB9E8" />
        {[146, 166, 186].map((y) => (
          <rect key={y} x="44" y={y} width="152" height="9" fill="#FFFDF5" />
        ))}
        <path d="M44 212H196" stroke={LINE} strokeWidth="4" />
      </g>
    ),
  },
  kamizelka: {
    body: (
      <g>
        <path d="M44 126H104L112 220Q80 228 44 214Z" fill="#C98A5E" stroke={LINE} strokeWidth="4" />
        <path d="M196 126H136L128 220Q160 228 196 214Z" fill="#C98A5E" stroke={LINE} strokeWidth="4" />
        <circle cx="102" cy="176" r="3.5" fill="#8A5A3B" />
        <circle cx="104" cy="196" r="3.5" fill="#8A5A3B" />
        <path d="M76 190h14" stroke="#8A5A3B" strokeWidth="3" strokeLinecap="round" />
      </g>
    ),
  },
  spodniczka: {
    over: (
      <g>
        <path d="M50 198H190L202 238Q120 254 38 238Z" fill="#F2A7C0" {...ln} />
        <path d="M86 204L74 246M120 204V250M154 204L166 246" stroke="#D9789B" strokeWidth="3" />
        <rect x="48" y="192" width="144" height="12" rx="6" fill="#D9789B" {...ln} />
      </g>
    ),
  },
  sweter: {
    body: (
      <g>
        <rect x="44" y="130" width="152" height="96" fill="#F2A7C0" />
        <rect x="44" y="216" width="152" height="12" fill="#D9789B" />
        <path d="M44 216H196" stroke={LINE} strokeWidth="3" />
        <path d={heart(120, 190, 13)} fill="#FFFDF5" stroke={LINE} strokeWidth="3" />
      </g>
    ),
  },
  tutu: {
    body: <rect x="44" y="130" width="152" height="80" fill="#F2A7C0" />,
    over: (
      <g>
        <path d="M48 206Q34 222 46 234Q64 228 76 240Q92 230 106 242Q120 230 134 242Q148 230 164 240Q176 228 194 234Q206 222 192 206Z" fill="#F8C8D8" {...ln} />
        <path d="M58 204Q52 218 64 224Q82 218 96 228Q120 218 144 228Q158 218 176 224Q188 218 182 204Z" fill="#FCE4EC" stroke={LINE} strokeWidth="2.5" />
        <rect x="48" y="198" width="144" height="10" rx="5" fill="#D9789B" {...ln} />
      </g>
    ),
  },
  sukienka: {
    body: (
      <g>
        <rect x="44" y="130" width="152" height="80" fill="#BBAEEC" />
        <circle cx="100" cy="168" r="4" fill="#FFFDF5" />
        <circle cx="140" cy="168" r="4" fill="#FFFDF5" />
        <circle cx="120" cy="184" r="4" fill="#FFFDF5" />
      </g>
    ),
    over: (
      <g>
        <path d="M50 196H190L204 240Q120 256 36 240Z" fill="#BBAEEC" {...ln} />
        {[
          [84, 228],
          [108, 216],
          [132, 230],
          [156, 218],
          [120, 240],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#FFFDF5" />
        ))}
        <rect x="48" y="190" width="144" height="12" rx="6" fill="#F6D58A" {...ln} />
        {bow(150, 198, 0.6, '#F6D58A', '#D9A441')}
      </g>
    ),
  },
  ogrodniczki: {
    body: (
      <g>
        <rect x="44" y="198" width="152" height="50" fill="#6F8FCF" />
        <rect x="96" y="150" width="48" height="52" rx="6" fill="#6F8FCF" stroke={LINE} strokeWidth="3" />
        <path d="M100 152L84 128M140 152L156 128" stroke="#6F8FCF" strokeWidth="10" />
        <path d="M44 198H96M144 198H196" stroke={LINE} strokeWidth="3" />
        <rect x="108" y="166" width="24" height="18" rx="4" fill="none" stroke="#B5CBEE" strokeWidth="2.5" />
        <circle cx="102" cy="158" r="4" fill="#F6D58A" stroke={LINE} strokeWidth="2" />
        <circle cx="138" cy="158" r="4" fill="#F6D58A" stroke={LINE} strokeWidth="2" />
      </g>
    ),
  },
  frak: {
    body: (
      <g>
        <rect x="44" y="130" width="152" height="120" fill="#3A3F5C" />
        <path d="M100 136L120 214L140 136Z" fill="#FFFDF5" />
        <path d="M100 136L112 176L96 168ZM140 136L128 176L144 168Z" fill="#4A5075" />
        {[176, 192, 206].map((y) => (
          <circle key={y} cx="120" cy={y} r="2.6" fill="#3A3F5C" />
        ))}
        <circle cx="96" cy="200" r="3" fill="#F2C866" />
        <circle cx="144" cy="200" r="3" fill="#F2C866" />
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
      <g>
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
}

/** Everything worn on one layer, for Smoczek to draw. Clothes on the body are clipped to its shape. */
export function OutfitLayer({ outfit, layer, clipId }: { outfit?: Outfit; layer: Layer; clipId?: string }) {
  if (!outfit) return null
  const parts = Object.values(outfit)
    .map((id) => (id ? [id, GADGET_ART[id]?.[layer]] : null))
    .filter((p): p is [string, ReactNode] => !!p && !!p[1])
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

const LAYER_ORDER: Layer[] = ['back', 'tail', 'body', 'over', 'feet', 'hand', 'head']

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
          art[layer] ? <OutfitLayer key={layer} outfit={{ [g.slot]: id }} layer={layer} clipId={layer === 'body' ? clip : undefined} /> : null,
        )}
      </g>
    </svg>
  )
}
