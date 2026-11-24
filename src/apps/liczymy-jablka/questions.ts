import type { LevelBase } from '../shared/scoring'

export interface Level extends LevelBase {
  mode: 'count' | 'add'
  max: number
  questions: number
  hintAfterMs: number
}

/** One question: apples on each plate (one plate when counting, two when adding). */
export interface Question {
  plates: number[]
  answer: number
}

/** A round of questions, never the same answer twice in a row. */
export function makeQuestions(level: Level, rand = Math.random): Question[] {
  const out: Question[] = []
  const max = Math.max(2, Math.min(9, level.max))
  while (out.length < level.questions) {
    let q: Question
    if (level.mode === 'add') {
      const a = 1 + Math.floor(rand() * (max - 1))
      const b = 1 + Math.floor(rand() * (max - a))
      q = { plates: [a, b], answer: a + b }
    } else {
      const n = 1 + Math.floor(rand() * max)
      q = { plates: [n], answer: n }
    }
    if (out.length && out[out.length - 1].answer === q.answer) continue
    out.push(q)
  }
  return out
}

/** Dice-like spots on a 3 by 3 grid (cells 0-8), so small numbers can be seen without counting. */
export const SPOTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
}
