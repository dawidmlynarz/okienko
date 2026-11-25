import { describe, expect, it } from 'vitest'
import data from '../../content/konik.json'
import { parseMap, runProgram, shortest, step } from './board'

const map = parseMap(['H.#', '..S', '~..'])

describe('Konik board', () => {
  it('finds the horse and the stable', () => {
    expect(map.horse).toEqual({ x: 0, y: 0 })
    expect(map.stable).toEqual({ x: 2, y: 1 })
  })

  it('stops at edges, fences and ponds', () => {
    expect(step(map, { x: 0, y: 0 }, 'up')).toBeNull()
    expect(step(map, { x: 1, y: 0 }, 'right')).toBeNull()
    expect(step(map, { x: 0, y: 1 }, 'down')).toBeNull()
    expect(step(map, { x: 0, y: 0 }, 'down')).toEqual({ x: 0, y: 1 })
  })

  it('runs a plan home', () => {
    const r = runProgram(map, ['down', 'right', 'right'])
    expect(r.home).toBe(true)
    expect(r.path).toHaveLength(4)
  })

  it('reports which card bumped', () => {
    expect(runProgram(map, ['right', 'right', 'down'])).toMatchObject({ bumpAt: 1, home: false })
  })

  it('every level map can be solved, in at most 12 cards', () => {
    for (const level of data.levels) {
      for (const rows of level.maps) {
        const d = shortest(parseMap(rows))
        expect(d, rows.join('/')).toBeGreaterThan(0)
        expect(d).toBeLessThanOrEqual(12)
      }
    }
  })
})
