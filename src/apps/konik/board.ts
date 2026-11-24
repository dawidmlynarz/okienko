/**
 * Konik wraca do stajni: the farm board and the rules for moving the horse.
 *
 * A map is rows of characters:
 *   .  grass        H  the horse starts here     S  the stable (goal)
 *   T  tree         #  fence                     ~  pond
 *   c  carrot (optional treat on the way)
 * Trees, fences and ponds block the horse.
 */

export type Dir = 'up' | 'down' | 'left' | 'right'
export interface Pos {
  x: number
  y: number
}
export type Cell = 'grass' | 'tree' | 'fence' | 'pond' | 'carrot' | 'stable'

export interface Board {
  w: number
  h: number
  cells: Cell[][]
  horse: Pos
  stable: Pos
}

export const DIRS: Dir[] = ['up', 'right', 'down', 'left']
const DELTA: Record<Dir, Pos> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

const CELL: Record<string, Cell> = { '.': 'grass', H: 'grass', S: 'stable', T: 'tree', '#': 'fence', '~': 'pond', c: 'carrot' }

export function parseMap(rows: string[]): Board {
  let horse: Pos | null = null
  let stable: Pos | null = null
  const cells = rows.map((row, y) =>
    [...row].map((ch, x) => {
      if (ch === 'H') horse = { x, y }
      if (ch === 'S') stable = { x, y }
      const c = CELL[ch]
      if (!c) throw new Error(`Unknown map character "${ch}"`)
      return c
    }),
  )
  if (!horse || !stable) throw new Error('A map needs one H and one S')
  return { w: rows[0].length, h: rows.length, cells, horse, stable }
}

export const blocked = (c: Cell) => c === 'tree' || c === 'fence' || c === 'pond'
export const samePos = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y

/** One step. Returns where the horse ends up, or null if a fence, tree, pond or the edge is in the way. */
export function step(board: Board, from: Pos, dir: Dir): Pos | null {
  const to = { x: from.x + DELTA[dir].x, y: from.y + DELTA[dir].y }
  if (to.x < 0 || to.y < 0 || to.x >= board.w || to.y >= board.h) return null
  if (blocked(board.cells[to.y][to.x])) return null
  return to
}

export interface RunResult {
  /** Every position the horse stands on, starting with where it began. */
  path: Pos[]
  /** Index of the card that hit something, if any. The horse stops there. */
  bumpAt: number | null
  home: boolean
}

/** Play a planned list of arrows. Stops at the first bump, or as soon as the horse reaches the stable. */
export function runProgram(board: Board, program: Dir[]): RunResult {
  const path = [board.horse]
  let at = board.horse
  for (let i = 0; i < program.length; i++) {
    const next = step(board, at, program[i])
    if (!next) return { path, bumpAt: i, home: false }
    at = next
    path.push(at)
    if (samePos(at, board.stable)) return { path, bumpAt: null, home: true }
  }
  return { path, bumpAt: null, home: false }
}

/** Fewest steps from the horse to the stable (breadth-first search), or -1 if there is no way. */
export function shortest(board: Board): number {
  const seen = new Set([`${board.horse.x},${board.horse.y}`])
  let frontier = [board.horse]
  for (let d = 0; frontier.length; d++) {
    const next: Pos[] = []
    for (const p of frontier) {
      if (samePos(p, board.stable)) return d
      for (const dir of DIRS) {
        const q = step(board, p, dir)
        if (q && !seen.has(`${q.x},${q.y}`)) {
          seen.add(`${q.x},${q.y}`)
          next.push(q)
        }
      }
    }
    frontier = next
  }
  return -1
}
