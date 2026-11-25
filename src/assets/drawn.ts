/**
 * Smoczy Domek's own picture set, drawn in the house style (see the illustration audit):
 * one warm near-black ink outline, flat muted pastels, dot eyes with a sparkle, pink blush.
 * Animals are little "bean" characters like Smoczek; food and things are chunky and rounded.
 * Every picture is a 64×64 SVG string, so <Picture> can drop it in like the old emoji.
 */

const E = '#2E2A33'
const W = 2.4
const S = `stroke="${E}" stroke-width="${W}" stroke-linejoin="round" stroke-linecap="round"`
const BLUSH = '#F7B7C5'
const CREAM = '#FFFDF5'

const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">${body}</svg>`
const p = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${S} ${extra}/>`
const c = (cx: number, cy: number, r: number, fill: string, line = true) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${line ? S : ''}/>`
const e = (cx: number, cy: number, rx: number, ry: number, fill: string, line = true, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${line ? S : ''} ${extra}/>`
const ln = (d: string, w = 1.8, color = E) => `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`

/** The bean body every animal shares. */
function bean(cx: number, top: number, bottom: number, hw: number, fill: string) {
  const d = `M${cx} ${top}C${cx + hw * 0.85} ${top} ${cx + hw} ${top + hw * 0.5} ${cx + hw} ${top + hw * 1.05}L${cx + hw * 1.04} ${bottom - hw * 0.55}C${cx + hw * 1.04} ${bottom - hw * 0.05} ${cx + hw * 0.6} ${bottom} ${cx} ${bottom}C${cx - hw * 0.6} ${bottom} ${cx - hw * 1.04} ${bottom - hw * 0.05} ${cx - hw * 1.04} ${bottom - hw * 0.55}L${cx - hw} ${top + hw * 1.05}C${cx - hw} ${top + hw * 0.5} ${cx - hw * 0.85} ${top} ${cx} ${top}Z`
  return p(d, fill)
}

/** Dot eyes, blush and a tiny mouth. */
function face(cx: number, ey: number, sp = 6.5, mouth: 'w' | 'smile' | 'open' | 'none' = 'w', blush = 4.6) {
  let s = ''
  s += c(cx - sp - blush, ey + 3.4, 3.1, BLUSH, false) + c(cx + sp + blush, ey + 3.4, 3.1, BLUSH, false)
  s += c(cx - sp - blush - 1, ey + 2.4, 0.7, '#fff', false) + c(cx + sp + blush - 1, ey + 2.4, 0.7, '#fff', false)
  s += e(cx - sp, ey, 1.9, 2.3, E, false) + e(cx + sp, ey, 1.9, 2.3, E, false)
  s += c(cx - sp + 0.7, ey - 0.8, 0.7, '#fff', false) + c(cx + sp + 0.7, ey - 0.8, 0.7, '#fff', false)
  if (mouth === 'w') s += ln(`M${cx - 2.4} ${ey + 2.2}q1.2 1.5 2.4 0q1.2 1.5 2.4 0`, 1.6)
  if (mouth === 'smile') s += ln(`M${cx - 2.2} ${ey + 2.2}q2.2 2.4 4.4 0`, 1.6)
  if (mouth === 'open') s += `<path d="M${cx - 2.6} ${ey + 2}q2.6 4 5.2 0z" fill="#B5576B" ${S} stroke-width="1.6"/>`
  return s
}

/** Little feet peeking under a bean and nub arms at its sides. */
const feet = (cx: number, y: number, fill: string, gap = 6.5) => e(cx - gap, y, 4.4, 2.8, fill) + e(cx + gap, y, 4.4, 2.8, fill)
const arms = (cx: number, y: number, hw: number, fill: string) =>
  e(cx - hw - 0.5, y, 3.6, 2.4, fill, true, `transform="rotate(-35 ${cx - hw - 0.5} ${y})"`) + e(cx + hw + 0.5, y, 3.6, 2.4, fill, true, `transform="rotate(35 ${cx + hw + 0.5} ${y})"`)

/** A standard animal: feet, extras behind, bean, belly, extras on top, face, arms. */
function critter(o: { body: string; foot?: string; belly?: string | null; behind?: string; front?: string; ey?: number; mouth?: 'w' | 'smile' | 'open' | 'none'; top?: number; hw?: number; sp?: number }) {
  const top = o.top ?? 13
  const hw = o.hw ?? 16.5
  const ey = o.ey ?? 29
  return svg(
    (o.behind ?? '') +
      feet(32, 58, o.foot ?? o.body) +
      bean(32, top, 58.5, hw, o.body) +
      (o.belly === null ? '' : e(32, 46, 9, 8.5, o.belly ?? CREAM, false)) +
      arms(32, 41, hw, o.body) +
      (o.front ?? '') +
      face(32, ey, o.sp ?? 6.5, o.mouth ?? 'w'),
  )
}

const star = (cx: number, cy: number, r: number, inner = 0.48) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const rr = i % 2 ? r * inner : r
    return `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`
  })
  return `M${pts.join('L')}Z`
}

const base = {
  /* ── Animals ─────────────────────────────────────── */
  kot: critter({
    body: '#F2B880',
    foot: '#E39A5C',
    behind: p('M17 24L17 6L29 14Z', '#F2B880') + p('M47 24L47 6L35 14Z', '#F2B880') + `<path d="M19 18L19.5 10L25 14Z" fill="${BLUSH}"/><path d="M45 18L44.5 10L39 14Z" fill="${BLUSH}"/>`,
    front: ln('M28 16v4M32 15v5M36 16v4', 2, '#D9844A') + ln('M14 30h5M14.5 34l4.5-1.5M50 30h-5M49.5 34l-4.5-1.5', 1.4) + e(32, 30.5, 1.4, 1, '#E07A8A', false),
  }),
  pies: critter({
    body: '#E6BC8E',
    foot: '#B9845A',
    front:
      p('M17 15c-6 1-8 12-4 18 3 2 6-1 7-5l1-10z', '#B9845A') +
      p('M47 15c6 1 8 12 4 18-3 2-6-1-7-5l-1-10z', '#B9845A') +
      e(32, 33, 6.5, 4.8, CREAM, false) +
      e(32, 31, 2.4, 1.7, E, false),
    ey: 27,
    mouth: 'none',
  }).replace('</svg>', ln('M30 34.5q2 1.6 4 0', 1.5) + '</svg>'),
  lis: critter({
    body: '#EE9363',
    foot: '#8A5A3B',
    behind:
      p('M45 52c10 2 15-8 12-16-2 6-7 8-12 8z', '#EE9363') +
      p('M57 36c-1 3-3 5-6 6l3 4c3-2 4-6 3-10z', CREAM) +
      p('M16 25L15 6L28 13Z', '#EE9363') +
      p('M48 25L49 6L36 13Z', '#EE9363') +
      `<path d="M16.5 12L16 7.5L21 10Z" fill="${E}"/><path d="M47.5 12L48 7.5L43 10Z" fill="${E}"/>`,
    front: `<path d="M16 30c4 6 10 8 16 8s12-2 16-8c-1 9-7 14-16 14S17 39 16 30z" fill="${CREAM}"/>` + e(32, 33, 1.6, 1.1, E, false),
    ey: 28,
  }),
  lew: critter({
    body: '#F3CC74',
    foot: '#D9A441',
    behind: Array.from({ length: 12 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 12
      return c(32 + Math.cos(a) * 15, 27 + Math.sin(a) * 14, 6.2, '#D98A45')
    }).join('') + c(32, 27, 15, '#D98A45', false),
    front: c(20.5, 15, 3.4, '#F3CC74') + c(43.5, 15, 3.4, '#F3CC74') + e(32, 32.5, 1.8, 1.2, '#8A5A3B', false),
    ey: 28,
    top: 12,
  }),
  mysz: critter({
    body: '#CFC8DE',
    foot: '#A99FC2',
    behind: ln('M47 52c8 2 12-4 9-9', W) + c(18, 14, 8, '#CFC8DE') + c(46, 14, 8, '#CFC8DE') + c(18, 14, 4.6, BLUSH, false) + c(46, 14, 4.6, BLUSH, false),
    front: e(32, 32, 1.8, 1.3, '#E07A8A', false) + ln('M15 31h5M15.5 35l4.5-1.5M49 31h-5M48.5 35l-4.5-1.5', 1.3),
    top: 16,
    ey: 29,
  }),
  sowa: critter({
    body: '#BE906A',
    foot: '#E0A060',
    behind: p('M17 20L15 8L25 14Z', '#BE906A') + p('M47 20L49 8L39 14Z', '#BE906A'),
    belly: '#F3E2C8',
    front:
      c(25, 26, 7, CREAM) +
      c(39, 26, 7, CREAM) +
      p('M32 30l-3 3 3 3 3-3z', '#F2A25C', 'stroke-width="1.8"') +
      ln('M27 45l2 2 2-2M33 45l2 2 2-2M30 50l2 2 2-2', 1.4, '#B98962'),
    ey: 26,
    sp: 7,
    mouth: 'none',
  }),
  zaba: critter({
    body: '#98C882',
    foot: '#6FA25C',
    belly: '#F3E6A8',
    behind: c(22, 17, 7.5, '#98C882') + c(42, 17, 7.5, '#98C882'),
    top: 15,
    ey: 17,
    sp: 10,
    mouth: 'none',
  }).replace('</svg>', ln('M24 27q8 7 16 0', 1.8) + '</svg>'),
  jez: svg(
    p('M10 44C6 34 10 24 14 22L12 16L19 17L19 10L25 13L28 6L32 12L36 6L39 13L45 10L45 17L52 16L50 22C54 24 58 34 54 44Z', '#9A6A48') +
      feet(32, 58, '#C99A70') +
      bean(32, 20, 58.5, 15.5, '#F1D9B5') +
      arms(32, 43, 15.5, '#F1D9B5') +
      face(32, 33, 6, 'w') +
      e(32, 36, 1.8, 1.3, E, false),
  ),
  mis: critter({
    body: '#BE906A',
    foot: '#8A5A3B',
    behind: c(19, 15, 6, '#BE906A') + c(45, 15, 6, '#BE906A') + c(19, 15, 3, '#E2B48C', false) + c(45, 15, 3, '#E2B48C', false),
    front: e(32, 33.5, 6, 4.4, '#F3E2C8', false) + e(32, 31.5, 2.2, 1.6, E, false),
    belly: '#F3E2C8',
    mouth: 'none',
    ey: 27,
  }).replace('</svg>', ln('M30 35q2 1.4 4 0', 1.4) + '</svg>'),
  kon: '',
  konik: '',
  slon: critter({
    body: '#B4C6DA',
    foot: '#8EA6C0',
    behind: e(14, 27, 9.5, 12, '#B4C6DA') + e(50, 27, 9.5, 12, '#B4C6DA') + e(14, 27, 5.5, 8, BLUSH, false) + e(50, 27, 5.5, 8, BLUSH, false),
    front: `<path d="M29 31c0 6 1 11-2 14-1 1.6 1 3 2.6 2 4-3 5-9 4.4-16z" fill="#B4C6DA" ${S}/>`,
    mouth: 'none',
    ey: 27,
    sp: 7.5,
  }),
  ryba: svg(
    p('M44 32l14-10c2 7 2 13 0 20z', '#5F9FD3') +
      p('M26 18c4-6 12-6 15 0z', '#5F9FD3') +
      e(28, 32, 20, 15, '#8CC3EC') +
      ln('M40 22c3 6 3 14 0 20', 1.6) +
      c(15, 28, 2.2, E, false) +
      c(15.7, 27.2, 0.7, '#fff', false) +
      c(18, 35, 3, BLUSH, false) +
      ln('M11 36q2 1.6 4 0', 1.6),
  ),
  rybka: svg(
    p('M44 32l14-11c2 7 2 15 0 22z', '#E58A5C') +
      p('M24 17c5-7 13-6 16 1z', '#E58A5C') +
      p('M26 46c4 5 10 5 13-1z', '#E58A5C') +
      e(28, 32, 20, 15, '#F5B386') +
      `<path d="M30 17.5c-4 9-4 20 0 29M38 19.5c-3 8-3 17 0 25" stroke="${CREAM}" stroke-width="4" fill="none"/>` +
      e(28, 32, 20, 15, 'none') +
      c(15, 28, 2.2, E, false) +
      c(15.7, 27.2, 0.7, '#fff', false) +
      c(18, 35, 3, BLUSH, false) +
      ln('M11 36q2 1.6 4 0', 1.6),
  ),
  biedronka: svg(
    ln('M26 12c-2-4-5-6-8-5M38 12c2-4 5-6 8-5', 2) +
      c(17.5, 7, 2.2, E, false) +
      c(46.5, 7, 2.2, E, false) +
      e(32, 38, 21, 20, '#E8776F') +
      p('M18 25c3-9 25-9 28 0c-5 3-23 3-28 0z', E) +
      ln('M32 27v31', W) +
      c(23, 37, 3.6, E, false) +
      c(41, 37, 3.6, E, false) +
      c(24, 49, 3, E, false) +
      c(40, 49, 3, E, false) +
      c(27.5, 21.5, 1.3, '#fff', false) +
      c(36.5, 21.5, 1.3, '#fff', false) +
      c(20, 29, 2.4, BLUSH, false) +
      c(44, 29, 2.4, BLUSH, false),
  ),

  /* ── Food ────────────────────────────────────────── */
  jablko: svg(
    ln('M32 18c0-5 1-8 4-10', W, '#8A5A3B') +
      p('M34 14c4-6 11-6 14-3-4 5-10 6-14 3z', '#8ED3A6') +
      p('M32 19c-6-5-20-4-22 9-2 12 6 26 15 27 3 0 5-1 7-2 2 1 4 2 7 2 9-1 17-15 15-27-2-13-16-14-22-9z', '#EB7D74') +
      ln('M17 26c1-3 3-5 6-6', 2, '#fff') +
      face(32, 35, 6, 'smile', 4),
  ),
  marchewka: svg(
    p('M30 16c-4-6-2-10 1-11 1 3 1 6 1 9 1-4 4-7 7-7 0 4-2 7-5 9z', '#8ED3A6') +
      p('M22 20c6-6 16-4 20 2 2 4-4 16-16 36-2 1-3 0-3-2-3-14-6-28-1-36z', '#F2A25C') +
      ln('M26 30h5M27 39h4M27 47h3', 1.8, '#C9733A'),
  ),
  ser: svg(
    p('M8 30L44 12L56 24V50L8 50Z', '#F6D58A') +
      p('M8 30L44 12L56 24L8 30Z', '#FBE6B0') +
      c(46, 34, 3.4, '#E0B657', false) +
      c(15, 43, 2.4, '#E0B657', false) +
      c(52, 44, 2, '#E0B657', false) +
      face(30, 38, 5.5, 'smile', 3.6),
  ),
  lody: svg(
    p('M20 34L32 60L44 34Z', '#E0B07A') +
      ln('M24 38l14 12M30 36l10 9M36 36l-12 11M42 38l-12 11', 1.4, '#B9845A') +
      p('M17 34c-3 0-4-4-1-6 0-8 7-14 16-14s16 6 16 14c3 2 2 6-1 6-2 3-5 3-7 1-2 2-6 2-8 0-2 2-6 2-8 0-2 2-5 2-7-1z', '#F2A7C0') +
      c(32, 11, 3.4, '#E8776F') +
      face(32, 24, 5.5, 'smile', 3.6),
  ),
  tort: svg(
    ln('M32 8v6', W, E) +
      p('M32 2c3 3 3 6 0 7-3-1-3-4 0-7z', '#F2C866', 'stroke-width="1.8"') +
      `<rect x="29.5" y="13" width="5" height="10" rx="2" fill="#BFDDF3" ${S}/>` +
      `<rect x="10" y="38" width="44" height="18" rx="5" fill="#F2A7C0" ${S}/>` +
      `<rect x="14" y="23" width="36" height="16" rx="5" fill="${CREAM}" ${S}/>` +
      p('M14 29c3 4 6 4 9 0 3 4 6 4 9 0 3 4 6 4 9 0 3 4 6 4 9 0', 'none') +
      c(18, 47, 1.6, CREAM, false) +
      c(32, 49, 1.6, CREAM, false) +
      c(46, 47, 1.6, CREAM, false),
  ),
  truskawka: svg(
    p('M32 17c-12-2-22 4-20 15 2 12 12 24 20 26 8-2 18-14 20-26 2-11-8-17-20-15z', '#E8776F') +
      p('M32 17l-9-6 4 7-9 1 8 4 6-3 6 3 8-4-9-1 4-7z', '#8ED3A6') +
      ln('M32 17V9', W, '#62B385') +
      [
        [20, 30],
        [44, 30],
        [24, 44],
        [40, 44],
        [32, 51],
      ]
        .map(([x, y]) => e(x, y, 0.9, 1.4, '#F6D58A', false))
        .join('') +
      face(32, 34, 5.5, 'smile', 3.4),
  ),
  banan: svg(
    p('M12 22c-2 16 8 30 26 32 8 1 15-2 18-6-2-2-6-1-9-1-16 0-26-11-28-25-1-3-6-3-7 0z', '#F6D58A') +
      p('M12 22c-1-4 0-7 3-8l2 6z', '#8A5A3B', 'stroke-width="1.8"') +
      ln('M21 26c2 12 10 20 22 22', 1.6, '#D9A441') +
      face(30, 40, 4.6, 'smile', 3.2),
  ),
  wisnie: svg(
    ln('M22 38c2-12 8-22 16-28M42 40c-2-10-2-20-4-30', W, '#62B385') +
      p('M38 10c6-4 12-2 14 2-5 4-10 3-14-2z', '#8ED3A6') +
      c(21, 44, 10, '#E8776F') +
      c(43, 46, 10, '#D9606A') +
      ln('M15 40c1-2 3-3 5-3M37 42c1-2 3-3 5-3', 1.8, '#fff') +
      face(21, 45, 3.2, 'none', 2.6) +
      face(43, 47, 3.2, 'none', 2.6),
  ),
  lizak: svg(
    `<rect x="29.5" y="36" width="5" height="24" rx="2.5" fill="${CREAM}" ${S}/>` +
      c(32, 24, 17, '#F2A7C0') +
      ln('M32 24c2 0 3-2 1.5-3.5-2.5-2-6 0-6 3.5 0 5 6 7 10 4 5-4 3-12-4-13-8-1-14 6-12 14 2 9 13 12 20 6', 4, CREAM) +
      c(32, 24, 17, 'none'),
  ),

  /* ── Nature and things ──────────────────────────── */
  slonce: svg(
    Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 8
      const x = 32 + Math.cos(a) * 24
      const y = 32 + Math.sin(a) * 24
      const deg = (a * 180) / Math.PI + 90
      return `<path d="M${x} ${y}l-4.5 7h9z" transform="rotate(${deg} ${x} ${y})" fill="#F2C866" ${S} stroke-width="2"/>`
    }).join('') +
      c(32, 32, 16, '#F6D58A') +
      face(32, 31, 5.5, 'smile', 3.6),
  ),
  gwiazda: svg(p(star(32, 34, 26, 0.5), '#F6D58A') + face(32, 35, 5, 'smile', 3.2)),
  kwiatek: svg(
    ln('M32 40v20', W + 0.6, '#62B385') +
      p('M32 52c-6-6-14-6-16-2 4 4 10 5 16 2z', '#8ED3A6') +
      p('M32 48c6-6 14-6 16-2-4 4-10 5-16 2z', '#8ED3A6') +
      [0, 1, 2, 3, 4]
        .map((i) => {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2
          return c(32 + Math.cos(a) * 11, 24 + Math.sin(a) * 11, 8, '#F2A7C0')
        })
        .join('') +
      c(32, 24, 7.5, '#F6D58A') +
      face(32, 23.5, 2.8, 'none', 2.4),
  ),
  tecza: svg(
    p('M4 46a28 28 0 0 1 56 0h-6a22 22 0 0 0-44 0z', '#E8857C') +
      p('M10 46a22 22 0 0 1 44 0h-6a16 16 0 0 0-32 0z', '#F6D58A') +
      p('M16 46a16 16 0 0 1 32 0h-6a10 10 0 0 0-20 0z', '#98C882') +
      p('M22 46a10 10 0 0 1 20 0h-5a5 5 0 0 0-10 0z', '#8CC3EC') +
      p('M2 50c0-4 3-6 6-5 1-3 6-4 8 0 3-1 5 2 4 5z', CREAM) +
      p('M44 50c0-4 3-6 6-5 1-3 6-4 8 0 3-1 5 2 4 5z', CREAM),
  ),
  choinka: svg(
    `<rect x="28" y="48" width="8" height="10" rx="2" fill="#8A5A3B" ${S}/>` +
      p('M32 8L14 34h8L10 50h44L42 34h8z', '#6FAE7E') +
      p(star(32, 9, 7), '#F6D58A', 'stroke-width="1.8"') +
      c(26, 31, 2.4, '#E8776F', false) +
      c(38, 40, 2.4, '#8CC3EC', false) +
      c(24, 44, 2.4, '#F6D58A', false) +
      c(40, 27, 2.2, '#F2A7C0', false),
  ),
  drzewo: svg(
    `<path d="M28 58V40h8v18z" fill="#A8714A" ${S}/>` +
      p('M14 36c-6-2-6-12 1-14-1-8 8-14 14-9 4-6 14-4 15 3 7 0 10 9 5 14 3 6-2 12-8 10-4 4-12 4-15 0-5 2-11 0-12-4z', '#8ED3A6') +
      c(24, 26, 2, '#6FAE7E', false) +
      c(40, 22, 2, '#6FAE7E', false) +
      c(36, 34, 2, '#6FAE7E', false),
  ),
  dom: svg(
    `<rect x="48" y="12" width="6" height="14" rx="1.5" fill="#C98A5E" ${S}/>` +
      `<rect x="14" y="28" width="36" height="28" rx="3" fill="${CREAM}" ${S}/>` +
      p('M8 31L32 9L56 31c2 2 0 4-2 3L32 15 10 34c-2 1-4-1-2-3z', '#E8857C') +
      `<path d="M27 56V44a5 5 0 0 1 10 0v12z" fill="#C98A5E" ${S}/>` +
      `<rect x="18" y="34" width="8" height="8" rx="2" fill="#BFDDF3" ${S} stroke-width="2"/>` +
      `<rect x="38" y="34" width="8" height="8" rx="2" fill="#BFDDF3" ${S} stroke-width="2"/>` +
      ln('M4 58h56', W),
  ),
  prezent: svg(
    `<rect x="10" y="28" width="44" height="28" rx="3" fill="#BBAEEC" ${S}/>` +
      `<rect x="7" y="20" width="50" height="10" rx="3" fill="#D3C9F3" ${S}/>` +
      `<path d="M28 20h8v36h-8z" fill="#F6D58A" ${S}/>` +
      p('M32 20c-4-8-14-12-15-6s9 6 15 6z', '#F6D58A') +
      p('M32 20c4-8 14-12 15-6s-9 6-15 6z', '#F6D58A'),
  ),
  rakieta: svg(
    p('M24 44l-10 6 2-12 8-4z', '#E8857C') +
      p('M40 44l10 6-2-12-8-4z', '#E8857C') +
      p('M26 50c2 6 4 10 6 12 2-2 4-6 6-12z', '#F2C866') +
      p('M32 4c-9 8-12 20-10 34 0 6 2 10 4 12h12c2-2 4-6 4-12 2-14-1-26-10-34z', CREAM) +
      p('M25 14c4-2 10-2 14 0-2-4-4-7-7-10-3 3-5 6-7 10z', '#E8857C') +
      c(32, 28, 6, '#8CC3EC') +
      ln('M30 26c1-1 2-1.6 3.4-1.6', 1.6, '#fff'),
  ),
  balon: svg(
    ln('M32 46c-3 5 3 8 0 12', 2) +
      p('M29 48l3-4 3 4z', '#E8857C', 'stroke-width="1.8"') +
      e(32, 24, 16, 20, '#E8857C') +
      ln('M23 14c2-3 5-4 8-4', 2.2, '#fff'),
  ),
  auto: svg(
    p('M6 40c0-6 3-9 8-10l6-10c2-3 5-4 8-4h12c3 0 6 2 8 5l5 9c7 1 11 4 11 10v4c0 2-1 3-3 3H9c-2 0-3-1-3-3z', '#E8857C') +
      p('M22 22c1-2 3-3 5-3h4v11H16z', '#BFDDF3', 'stroke-width="2"') +
      p('M35 19h5c2 0 3 1 4 3l4 8H35z', '#BFDDF3', 'stroke-width="2"') +
      c(17, 47, 7, '#5B5F75') +
      c(47, 47, 7, '#5B5F75') +
      c(17, 47, 2.6, '#D7DAE3', false) +
      c(47, 47, 2.6, '#D7DAE3', false) +
      e(56, 37, 2.4, 1.8, '#F6D58A', false),
  ),
  oko: svg(
    p('M4 34c8-12 18-18 28-18s20 6 28 18c-8 12-18 18-28 18S12 46 4 34z', CREAM) +
      c(32, 34, 11, '#8CC3EC') +
      c(32, 34, 5.5, E, false) +
      c(35, 31, 2.2, '#fff', false) +
      ln('M14 22l-3-5M24 17l-1-6M40 17l1-6M50 22l3-5', W),
  ),
  nos: svg(
    p('M30 6c-2 14-10 22-14 32-3 8 2 14 9 14 3 0 4-2 7-2s4 2 7 2c7 0 12-6 9-14-4-10-12-18-14-32z', '#F5C6A6') +
      e(25, 44, 2.6, 1.8, '#C98A70', false) +
      e(39, 44, 2.6, 1.8, '#C98A70', false) +
      ln('M28 18c-1 6-3 10-6 14', 1.8, '#fff'),
  ),
  klucz: svg(
    p('M30 34h26v7h-5v6h-6v-6h-4v4h-6v-4h-5z', '#F2C866') +
      c(20, 37, 13, '#F2C866') +
      c(20, 37, 5, CREAM) +
      ln('M12 32c1-3 3-5 6-6', 2, '#fff'),
  ),
  klodka: svg(
    `<path d="M20 30V20a12 12 0 0 1 24 0v10" fill="none" stroke="${E}" stroke-width="11" stroke-linecap="round"/>` +
      `<path d="M20 30V20a12 12 0 0 1 24 0v10" fill="none" stroke="#C9CCD6" stroke-width="6" stroke-linecap="round"/>` +
      `<rect x="11" y="28" width="42" height="30" rx="7" fill="#F2C866" ${S}/>` +
      p('M32 37a4 4 0 0 1 2 7.5V50h-4v-5.5A4 4 0 0 1 32 37z', E, 'stroke-width="1"'),
  ),
  korona: svg(
    p('M8 22l12 12 12-20 12 20 12-12-4 30H12z', '#F6D58A') +
      `<rect x="12" y="46" width="40" height="8" rx="2" fill="#F2C866" ${S}/>` +
      c(8, 21, 3.4, '#E8776F', true) +
      c(32, 13, 3.4, '#8CC3EC', true) +
      c(56, 21, 3.4, '#E8776F', true) +
      c(32, 38, 3.6, '#BBAEEC', true),
  ),

  /* ── App icons ──────────────────────────────────── */
  notes: svg(
    `<rect x="12" y="8" width="36" height="48" rx="5" fill="${CREAM}" ${S}/>` +
      ln('M19 22h22M19 30h22M19 38h14', 2.2, '#B4C6DA') +
      p('M40 50l14-24 5 3-14 24-6 3z', '#F6D58A') +
      p('M54 26l2-3c1-1 3-1 4 0s1 2 0 3l-1 3z', '#E8857C'),
  ),
  obrazek: svg(
    `<rect x="6" y="12" width="52" height="42" rx="5" fill="#C98A5E" ${S}/>` +
      `<rect x="12" y="18" width="40" height="30" rx="2" fill="#CFE6F7" ${S} stroke-width="2"/>` +
      p('M12 40c8-8 14-8 20-2 6-8 14-8 20 0v10H12z', '#98C882', 'stroke-width="2"') +
      c(42, 26, 4, '#F6D58A', true),
  ),
  karty: svg(
    `<g transform="rotate(-12 22 32)"><rect x="9" y="12" width="26" height="38" rx="5" fill="#8CC3EC" ${S}/>${p('M22 22l6 9-6 9-6-9z', CREAM, 'stroke-width="2"')}</g>` +
      `<g transform="rotate(10 42 32)"><rect x="29" y="12" width="26" height="38" rx="5" fill="${CREAM}" ${S}/><path d="M42 41s-8-5-8-10a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 5-8 10-8 10z" fill="#E8776F" ${S} stroke-width="2"/></g>`,
  ),
}

export type PictureId = keyof typeof base
export const drawnSvg: Record<PictureId, string> = base

/* The horse: a bean pony with a mane, used for both the word "koń" and the Konik game. */
drawnSvg.konik = critter({
  body: '#E6BC8E',
  foot: '#8A5A3B',
  behind: p('M18 24L19 8L29 15Z', '#E6BC8E') + p('M46 24L45 8L35 15Z', '#E6BC8E') + p('M45 30c10 2 13 12 9 20-2-6-6-8-10-9z', '#8A5A3B'),
  front:
    p('M23 13c2-6 8-8 13-6 4-2 9 1 9 5-3 0-5 2-6 5-3-2-7-3-10-1-2-2-4-3-6-3z', '#8A5A3B') +
    e(32, 36, 8, 5.5, '#F3E2C8', false) +
    e(29, 36, 1.2, 1.6, '#8A5A3B', false) +
    e(35, 36, 1.2, 1.6, '#8A5A3B', false),
  ey: 27,
  mouth: 'none',
  sp: 7,
})
drawnSvg.kon = drawnSvg.konik
