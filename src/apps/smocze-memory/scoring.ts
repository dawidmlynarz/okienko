import type { Stars } from '../shared/scoring'

/**
 * A perfect game takes as many moves as there are pairs, but that needs luck.
 * Three stars allow a few peeks, two stars a few more; finishing always earns one.
 */
export function memoryStars(moves: number, pairs: number): Stars {
  if (moves <= Math.ceil(pairs * 1.7)) return 3
  if (moves <= Math.ceil(pairs * 2.5)) return 2
  return 1
}
