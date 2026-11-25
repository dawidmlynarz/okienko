import { describe, expect, it } from 'vitest'
import { SPOTS, makeQuestions, type Level } from './questions'

const level = (mode: Level['mode'], max: number): Level => ({ id: 't', title: 't', subtitle: 't', unlockStars: 0, mode, max, questions: 40, hintAfterMs: 0 })

describe('makeQuestions', () => {
  it('counts stay between 1 and max', () => {
    for (const q of makeQuestions(level('count', 5))) {
      expect(q.plates).toHaveLength(1)
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThanOrEqual(5)
    }
  })
  it('sums use two plates and never pass max, so the answer is one key', () => {
    for (const q of makeQuestions(level('add', 9))) {
      expect(q.plates).toHaveLength(2)
      expect(q.plates.every((p) => p >= 1)).toBe(true)
      expect(q.answer).toBe(q.plates[0] + q.plates[1])
      expect(q.answer).toBeLessThanOrEqual(9)
    }
  })
  it('never repeats an answer twice in a row', () => {
    const qs = makeQuestions(level('count', 3))
    qs.slice(1).forEach((q, i) => expect(q.answer).not.toBe(qs[i].answer))
  })
  it('has a spot layout for every number', () => {
    for (let n = 1; n <= 9; n++) expect(SPOTS[n]).toHaveLength(n)
  })
})

describe('three plates', () => {
  it('adds three small plates and stays a single digit', () => {
    for (const q of makeQuestions(level('add3', 9))) {
      expect(q.plates).toHaveLength(3)
      expect(q.answer).toBe(q.plates.reduce((a, b) => a + b, 0))
      expect(q.answer).toBeLessThanOrEqual(9)
      expect(Math.min(...q.plates)).toBeGreaterThanOrEqual(1)
    }
  })
})
