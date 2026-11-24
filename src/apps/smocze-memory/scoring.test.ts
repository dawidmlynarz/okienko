import { describe, expect, it } from 'vitest'
import { memoryStars } from './scoring'

describe('memoryStars', () => {
  it('rewards few moves', () => {
    expect(memoryStars(3, 3)).toBe(3)
    expect(memoryStars(6, 3)).toBe(3)
    expect(memoryStars(8, 3)).toBe(2)
    expect(memoryStars(20, 3)).toBe(1)
  })
})
