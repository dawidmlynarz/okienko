import { describe, expect, it } from 'vitest'
import { fresh } from './bag'

describe('fresh', () => {
  it('uses every item once before repeating, and never twice in a row', () => {
    const list = ['a', 'b', 'c', 'd', 'e'] as const
    let prev = ''
    for (let round = 0; round < 20; round++) {
      const seen = new Set<string>()
      for (let i = 0; i < list.length; i++) {
        const x = fresh(list)
        expect(x).not.toBe(prev)
        seen.add(x)
        prev = x
      }
      expect(seen.size).toBe(list.length)
    }
  })
})
