import { describe, expect, it } from 'vitest'
import { levels, makeRound, starsFor } from './levels'

describe('Balonowy Las content', () => {
  it('rounds have the right length, use only level letters, and never repeat back to back', () => {
    for (const level of levels) {
      for (let i = 0; i < 50; i++) {
        const r = makeRound(level)
        expect(r).toHaveLength(level.balloons)
        r.forEach((c, j) => {
          expect(level.letters).toContain(c)
          if (j) expect(c).not.toBe(r[j - 1])
        })
      }
    }
  })

  it('awards stars by first-try accuracy', () => {
    expect(starsFor(10, 10)).toBe(3)
    expect(starsFor(9, 10)).toBe(3)
    expect(starsFor(6, 10)).toBe(2)
    expect(starsFor(2, 10)).toBe(1)
  })
})
