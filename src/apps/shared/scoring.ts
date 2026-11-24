/** What every level card needs. Level ids are unique across all games (best stars are stored by id). */
export interface LevelBase {
  id: string
  title: string
  subtitle: string
  unlockStars: number
}

export type Stars = 1 | 2 | 3

/** 90% right first time is three stars, 60% two, anything else one. Every finished round earns a star. */
export function starsFor(good: number, total: number): Stars {
  const r = total ? good / total : 0
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1
}

/** Fisher-Yates shuffle into a new array. */
export function shuffle<T>(xs: readonly T[], rand = Math.random): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
