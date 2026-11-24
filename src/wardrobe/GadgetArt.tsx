import type { ReactNode } from 'react'
import { gadgetById, type Outfit } from './items'

/**
 * Gadget drawings, in Smoczek's own 240×260 coordinates so they sit on him exactly.
 * Each gadget may draw on several layers: behind him (back), on the tail, on the head
 * (moves with his head), or in front of everything.
 */
export type Layer = 'back' | 'tail' | 'head' | 'front'

const LINE = 'var(--line, #3B2A22)'
const W = 4

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

/** A thick line with an outline: draw the outline wider first, then the colour. */
const band = (d: string, color: string, width: number, extra?: ReactNode) => (
  <>
    <path d={d} fill="none" stroke={LINE} strokeWidth={width + W * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    {extra}
  </>
)

type Art = Partial<Record<Layer, ReactNode>> & {
  /** Crop for the shop card picture. */
  box: string
}

const ln = { stroke: LINE, strokeWidth: W, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

export const GADGET_ART: Record<string, Art> = {
  czapka: {
    box: '62 -2 116 76',
    head: (
      <g>
        <path d="M80 60C78 14 162 14 160 60Z" fill="#F2665A" {...ln} />
        <path d="M102 26v26M120 20v32M138 26v26" stroke="#FFB4A8" strokeWidth="5" strokeLinecap="round" />
        <rect x="72" y="50" width="96" height="18" rx="9" fill="#FFF6EC" {...ln} />
        <circle cx="120" cy="14" r="11" fill="#FFF6EC" {...ln} />
      </g>
    ),
  },
  urodzinowa: {
    box: '80 -12 84 80',
    head: (
      <g transform="rotate(10 121 58)">
        <path d="M96 60L121 0L146 60Q121 68 96 60Z" fill="#B6AAFE" {...ln} />
        <circle cx="114" cy="44" r="4.5" fill="#FFD66B" />
        <circle cx="130" cy="34" r="4" fill="#FF8FB1" />
        <circle cx="124" cy="52" r="4" fill="#5ED19A" />
        <circle cx="120" cy="22" r="3.5" fill="#FFD66B" />
        <circle cx="121" cy="0" r="8" fill="#FF8FB1" {...ln} />
      </g>
    ),
  },
  czarodziej: {
    box: '56 -26 128 96',
    head: (
      <g>
        <path d="M88 56Q102 28 108 -18Q130 6 154 54Z" fill="#4B50B0" {...ln} />
        <ellipse cx="120" cy="56" rx="58" ry="12" fill="#3B3F8F" {...ln} />
        <path d="M92 48Q120 56 150 46" fill="none" stroke="#FFD66B" strokeWidth="6" strokeLinecap="round" />
        <path d={star(116, 18, 8)} fill="#FFD66B" />
        <path d={star(134, 34, 6)} fill="#FFD66B" />
        <path d={star(104, 36, 4.5)} fill="#FFF6EC" />
      </g>
    ),
  },
  korona: {
    box: '68 0 104 72',
    head: (
      <g>
        <path d="M84 62L78 24L102 42L120 12L138 42L162 24L156 62Z" fill="#FFCF4D" {...ln} />
        <path d="M86 54H154" stroke="#E9A92A" strokeWidth="4" strokeLinecap="round" />
        <circle cx="78" cy="22" r="6" fill="#FFCF4D" {...ln} />
        <circle cx="120" cy="10" r="6" fill="#FFCF4D" {...ln} />
        <circle cx="162" cy="22" r="6" fill="#FFCF4D" {...ln} />
        <circle cx="120" cy="44" r="6" fill="#E5484D" {...ln} />
        <circle cx="100" cy="50" r="4.5" fill="#3BA4F5" />
        <circle cx="140" cy="50" r="4.5" fill="#3CCB7F" />
      </g>
    ),
  },
  okulary: {
    box: '48 66 144 58',
    head: (
      <g fill="none" stroke="#7A4B2A" strokeWidth="6" strokeLinecap="round">
        <circle cx="92" cy="96" r="21" fill="#fff" fillOpacity=".2" />
        <circle cx="148" cy="96" r="21" fill="#fff" fillOpacity=".2" />
        <path d="M113 92Q120 84 127 92M71 92L54 86M169 92L186 86" />
      </g>
    ),
  },
  sloneczne: {
    box: '48 70 144 50',
    head: (
      <g>
        <path d="M116 90Q120 85 124 90M70 90L54 84M170 90L186 84" fill="none" stroke="#1B2240" strokeWidth="6" strokeLinecap="round" />
        <rect x="66" y="80" width="50" height="32" rx="14" fill="#1B2240" />
        <rect x="124" y="80" width="50" height="32" rx="14" fill="#1B2240" />
        <path d="M76 90l12-3M134 90l12-3" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".75" />
      </g>
    ),
  },
  serduszka: {
    box: '48 64 144 62',
    head: (
      <g>
        <path d="M114 90Q120 84 126 90M68 88L54 82M172 88L186 82" fill="none" stroke="#C2255C" strokeWidth="6" strokeLinecap="round" />
        <path d={heart(92, 96, 22)} fill="#FF5C93" fillOpacity=".55" stroke="#C2255C" strokeWidth="5" strokeLinejoin="round" />
        <path d={heart(148, 96, 22)} fill="#FF5C93" fillOpacity=".55" stroke="#C2255C" strokeWidth="5" strokeLinejoin="round" />
      </g>
    ),
  },
  muszka: {
    box: '80 140 80 50',
    head: (
      <g>
        <path d="M120 164L94 149Q87 164 94 179Z" fill="#E5484D" {...ln} />
        <path d="M120 164L146 149Q153 164 146 179Z" fill="#E5484D" {...ln} />
        <circle cx="100" cy="158" r="2.6" fill="#fff" />
        <circle cx="102" cy="170" r="2.6" fill="#fff" />
        <circle cx="140" cy="158" r="2.6" fill="#fff" />
        <circle cx="138" cy="170" r="2.6" fill="#fff" />
        <rect x="111" y="156" width="18" height="16" rx="6" fill="#C2343A" {...ln} />
      </g>
    ),
  },
  szalik: {
    box: '48 120 144 100',
    head: (
      <g>
        {band('M136 162L130 206', '#3CCB7F', 18)}
        <path d="M130 196l-1 8" stroke="#FFF6EC" strokeWidth="18" />
        {band('M62 136Q120 196 178 136', '#3CCB7F', 20)}
        <path d="M62 136Q120 196 178 136" fill="none" stroke="#FFF6EC" strokeWidth="20" strokeDasharray="10 14" />
      </g>
    ),
  },
  medal: {
    box: '86 136 68 76',
    head: (
      <g>
        {band('M100 146L117 182', '#3BA4F5', 9)}
        {band('M140 146L123 182', '#E5484D', 9)}
        <circle cx="120" cy="192" r="15" fill="#FFCF4D" {...ln} />
        <path d={star(120, 192, 8)} fill="#E9A92A" />
      </g>
    ),
  },
  balonik: {
    box: '4 60 76 150',
    front: (
      <g>
        <path d="M34 122Q46 150 32 170Q22 188 64 200" fill="none" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="34" cy="92" rx="23" ry="27" fill="#3BA4F5" {...ln} />
        <path d="M29 124L34 117L39 124Z" fill="#3BA4F5" {...ln} />
        <path d="M24 78Q28 70 36 70" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      </g>
    ),
  },
  kokardka: {
    box: '184 174 50 46',
    tail: (
      <g>
        <path d="M208 196L190 184Q186 196 190 208Z" fill="#FF8FB1" {...ln} />
        <path d="M208 196L226 184Q230 196 226 208Z" fill="#FF8FB1" {...ln} />
        <circle cx="208" cy="196" r="6" fill="#E5487F" {...ln} />
      </g>
    ),
  },
  peleryna: {
    box: '36 128 168 128',
    back: <path d="M80 142Q56 200 42 244Q120 258 198 244Q184 200 160 142Z" fill="#E5484D" {...ln} />,
    head: (
      <g>
        {band('M78 150Q120 172 162 150', '#E5484D', 10)}
        <circle cx="120" cy="162" r="8" fill="#FFCF4D" {...ln} />
      </g>
    ),
  },
}

/** Everything worn on one layer, for Smoczek to draw. */
export function OutfitLayer({ outfit, layer }: { outfit?: Outfit; layer: Layer }) {
  if (!outfit) return null
  return (
    <>
      {Object.values(outfit).map((id) => {
        const art = id ? GADGET_ART[id]?.[layer] : null
        return art ? <g key={id}>{art}</g> : null
      })}
    </>
  )
}

/** A gadget on its own, for the shop shelf. */
export function GadgetPicture({ id, size = 96 }: { id: string; size?: number | string }) {
  const art = GADGET_ART[id]
  const g = gadgetById(id)
  if (!art || !g) return null
  return (
    <svg viewBox={art.box} width={size} height={size} role="img" aria-label={g.name} style={{ overflow: 'visible', ['--line' as string]: '#3B2A22' }}>
      {art.back}
      {art.tail}
      {art.head}
      {art.front}
    </svg>
  )
}
