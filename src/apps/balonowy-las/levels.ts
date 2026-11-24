import data from '../../content/balonowy-las.json'
import type { LevelBase } from '../shared/scoring'

export interface Level extends LevelBase {
  letters: string
  balloons: number
  riseMs: number
  hintAfterMs: number
}

export const levels: Level[] = data.levels

/** A round's letters: random, but never the same letter twice in a row, and every letter shows up early. */
export function makeRound(level: Level, rand = Math.random): string[] {
  const pool = [...level.letters]
  const out: string[] = []
  let bag: string[] = []
  while (out.length < level.balloons) {
    if (!bag.length) bag = [...pool].sort(() => rand() - 0.5)
    const next = bag.shift()!
    if (out[out.length - 1] === next && bag.length) {
      bag.push(next)
      continue
    }
    out.push(next)
  }
  return out
}

export { starsFor } from '../shared/scoring'
