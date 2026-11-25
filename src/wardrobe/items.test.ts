import { describe, expect, it } from 'vitest'
import { GADGET_ART } from './GadgetArt'
import { GADGETS, SLOTS, balanceOf, buy, nextGoal, toggleWear, type Wardrobe } from './items'

const empty: Wardrobe = { owned: [], worn: {} }

describe('wardrobe', () => {
  it('spends stars and puts the gadget on', () => {
    const r = buy(empty, { stars: 5 }, 'muszka')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.spent).toBe(3)
    expect(balanceOf({ stars: 5, spent: r.spent })).toBe(2)
    expect(r.wardrobe.owned).toEqual(['muszka'])
    expect(r.wardrobe.worn.neck).toBe('muszka')
  })

  it('refuses when stars are short, and says by how many', () => {
    expect(buy(empty, { stars: 10, spent: 8 }, 'korona')).toEqual({ ok: false, reason: 'missing', short: 23 })
  })

  it('never sells the same gadget twice', () => {
    expect(buy({ owned: ['muszka'], worn: {} }, { stars: 50 }, 'muszka')).toMatchObject({ ok: false, reason: 'owned' })
  })

  it('swaps gadgets in the same slot and takes one off on a second tap', () => {
    let w: Wardrobe = { owned: ['czapka', 'korona'], worn: { head: 'czapka' } }
    w = toggleWear(w, 'korona')
    expect(w.worn.head).toBe('korona')
    w = toggleWear(w, 'korona')
    expect(w.worn.head).toBeUndefined()
    expect(toggleWear(w, 'medal')).toBe(w)
  })

  it('aims at the cheapest gadget not owned yet', () => {
    expect(nextGoal(empty)?.price).toBe(3)
    expect(nextGoal({ owned: GADGETS.map((g) => g.id), worn: {} })).toBeNull()
  })

  it('has eight gadgets on every shelf, each with a drawing', () => {
    for (const slot of SLOTS) expect(GADGETS.filter((g) => g.slot === slot)).toHaveLength(8)
    for (const g of GADGETS) expect(GADGET_ART[g.id], g.id).toBeTruthy()
  })

  it('has unique ids and prices a kid can reach', () => {
    expect(new Set(GADGETS.map((g) => g.id)).size).toBe(GADGETS.length)
    expect(Math.max(...GADGETS.map((g) => g.price))).toBeLessThanOrEqual(30)
  })
})
