import { describe, expect, it } from 'vitest'
import data from '../../content/labirynt.json'
import { DIRS, distance, generate, isOpen, samePos, shortest, step } from './maze'

describe('Labirynt maze', () => {
  it('opens walls on both sides', () => {
    const m = generate(6, 5, 7)
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++)
        for (const d of DIRS) {
          if (!isOpen(m, { x, y }, d)) continue
          const r = step(m, { x, y }, d, true)
          expect('to' in r).toBe(true)
        }
    expect(step(m, { x: 0, y: 0 }, 'up', true)).toEqual({ blocked: 'wall' })
  })

  it('is perfect: every cell reachable, one way between any two', () => {
    const m = generate(9, 6, 42)
    let passages = 0
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) passages += DIRS.filter((d) => isOpen(m, { x, y }, d)).length
    expect(passages / 2).toBe(m.w * m.h - 1)
    expect(distance(m, m.start, m.goal)).toBeGreaterThan(0)
  })

  it('the door blocks the cheese until the key is picked up', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const m = generate(9, 6, seed, true)
      expect(m.key && m.door).toBeTruthy()
      expect(distance(m, m.start, m.goal, false), `seed ${seed}`).toBe(-1)
      expect(distance(m, m.start, m.key!, false), `seed ${seed}`).toBeGreaterThan(0)
      expect(samePos(m.key!, m.start)).toBe(false)
      expect(shortest(m)).toBeGreaterThan(distance(m, m.start, m.goal))
    }
  })

  it('every level makes solvable mazes', () => {
    for (const level of data.levels)
      for (let seed = 1; seed <= 50; seed++) {
        const m = generate(level.w, level.h, seed, level.key)
        expect(shortest(m), `${level.id} seed ${seed}`).toBeGreaterThan(0)
      }
  })
})
