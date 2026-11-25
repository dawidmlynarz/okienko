/**
 * Maze logic for Labirynt. A maze is a grid of cells; each cell keeps which of its
 * four sides are open. Mazes are "perfect" (exactly one way between any two cells),
 * so a locked door on the way to the cheese cannot be walked around.
 */

export type Dir = 'up' | 'down' | 'left' | 'right'
export interface Pos {
  x: number
  y: number
}

const BIT: Record<Dir, number> = { up: 1, right: 2, down: 4, left: 8 }
const DELTA: Record<Dir, Pos> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }
export const DIRS: Dir[] = ['up', 'right', 'down', 'left']

export interface Maze {
  w: number
  h: number
  /** open[y][x] is a bitmask of open sides (up 1, right 2, down 4, left 8). */
  open: number[][]
  start: Pos
  goal: Pos
  /** With a key: the door sits between door.a and door.b and opens once the key is picked up. */
  key: Pos | null
  door: { a: Pos; b: Pos } | null
}

export const samePos = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y
const id = (p: Pos) => `${p.x},${p.y}`

/** Small seeded random, so a maze can be rebuilt and tested. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

export const isOpen = (m: Maze, p: Pos, d: Dir) => (m.open[p.y][p.x] & BIT[d]) !== 0

const isDoor = (m: Maze, a: Pos, b: Pos) => !!m.door && ((samePos(m.door.a, a) && samePos(m.door.b, b)) || (samePos(m.door.a, b) && samePos(m.door.b, a)))

/** Where one step leads, or what stops it. */
export function step(m: Maze, p: Pos, d: Dir, hasKey: boolean): { to: Pos } | { blocked: 'wall' | 'door' } {
  if (!isOpen(m, p, d)) return { blocked: 'wall' }
  const to = { x: p.x + DELTA[d].x, y: p.y + DELTA[d].y }
  if (!hasKey && isDoor(m, p, to)) return { blocked: 'door' }
  return { to }
}

/** Steps between two cells, BFS. `throughDoor` false treats the door as a wall. */
export function distance(m: Maze, from: Pos, to: Pos, throughDoor = true): number {
  const seen = new Set([id(from)])
  let frontier = [from]
  for (let d = 0; frontier.length; d++) {
    const next: Pos[] = []
    for (const p of frontier) {
      if (samePos(p, to)) return d
      for (const dir of DIRS) {
        const r = step(m, p, dir, throughDoor)
        if ('to' in r && !seen.has(id(r.to))) {
          seen.add(id(r.to))
          next.push(r.to)
        }
      }
    }
    frontier = next
  }
  return -1
}

/** Fewest steps to the cheese, fetching the key first when there is one. */
export function shortest(m: Maze): number {
  if (!m.key) return distance(m, m.start, m.goal)
  const a = distance(m, m.start, m.key, false)
  const b = distance(m, m.key, m.goal)
  return a < 0 || b < 0 ? -1 : a + b
}

/** The one path between two cells in a perfect maze. */
function pathBetween(m: Maze, from: Pos, to: Pos): Pos[] {
  const prev = new Map<string, Pos | null>([[id(from), null]])
  const queue = [from]
  while (queue.length) {
    const p = queue.shift()!
    if (samePos(p, to)) break
    for (const dir of DIRS) {
      const r = step(m, p, dir, true)
      if ('to' in r && !prev.has(id(r.to))) {
        prev.set(id(r.to), p)
        queue.push(r.to)
      }
    }
  }
  const path: Pos[] = []
  for (let p: Pos | null | undefined = to; p; p = prev.get(id(p))) path.unshift(p)
  return path
}

/** Recursive backtracker: long winding corridors that are fun to follow. */
export function generate(w: number, h: number, seed: number, withKey = false): Maze {
  const rand = rng(seed)
  const open = Array.from({ length: h }, () => Array<number>(w).fill(0))
  const seen = Array.from({ length: h }, () => Array<boolean>(w).fill(false))
  // Digging from the middle gives side branches near the start too, so a key has somewhere to hide.
  const root = { x: Math.floor(rand() * w), y: Math.floor(rand() * h) }
  const stack: Pos[] = [root]
  seen[root.y][root.x] = true
  while (stack.length) {
    const p = stack[stack.length - 1]
    const options = DIRS.filter((d) => {
      const x = p.x + DELTA[d].x
      const y = p.y + DELTA[d].y
      return x >= 0 && y >= 0 && x < w && y < h && !seen[y][x]
    })
    if (!options.length) {
      stack.pop()
      continue
    }
    const d = options[Math.floor(rand() * options.length)]
    const n = { x: p.x + DELTA[d].x, y: p.y + DELTA[d].y }
    open[p.y][p.x] |= BIT[d]
    open[n.y][n.x] |= BIT[OPPOSITE[d]]
    seen[n.y][n.x] = true
    stack.push(n)
  }

  const m: Maze = { w, h, open, start: { x: 0, y: 0 }, goal: { x: w - 1, y: h - 1 }, key: null, door: null }
  if (!withKey) return m

  // The door goes on the way to the cheese; the key hides in a side branch before it, so she
  // has to look for it. Try a few door spots and keep the one with the longest detour to the key.
  const path = pathBetween(m, m.start, m.goal)
  const direct = path.length - 1
  let best: { door: Maze['door']; key: Pos; detour: number } | null = null
  const onPath = new Set(path.map(id))
  for (let i = Math.max(2, Math.floor(path.length * 0.4)); i <= Math.floor(path.length * 0.8); i++) {
    m.door = { a: path[i - 1], b: path[i] }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const c = { x, y }
        if (onPath.has(id(c))) continue
        const toKey = distance(m, m.start, c, false)
        if (toKey < 0) continue
        const detour = toKey + distance(m, c, m.goal) - direct + rand()
        if (!best || detour > best.detour) best = { door: m.door, key: c, detour }
      }
  }
  // No side branch before any door spot (very rare): build another maze.
  if (!best) return generate(w, h, seed + 7919, true)
  m.door = best.door
  m.key = best.key
  return m
}
