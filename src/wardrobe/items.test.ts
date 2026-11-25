import { describe, expect, it } from 'vitest'
import { GADGET_ART } from './GadgetArt'
import { GADGETS, SLOTS, balanceOf, buy, clash, nextGoal, toggleWear, wornList, type Wardrobe } from './items'

const empty: Wardrobe = { owned: [], worn: [] }

describe('wardrobe', () => {
  it('spends stars and puts the gadget on', () => {
    const r = buy(empty, { stars: 5 }, 'muszka')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.spent).toBe(3)
    expect(balanceOf({ stars: 5, spent: r.spent })).toBe(2)
    expect(r.wardrobe.owned).toEqual(['muszka'])
    expect(r.wardrobe.worn).toEqual(['muszka'])
  })

  it('refuses when stars are short, and says by how many', () => {
    expect(buy(empty, { stars: 10, spent: 8 }, 'korona')).toEqual({ ok: false, reason: 'missing', short: 23 })
  })

  it('never sells the same gadget twice', () => {
    expect(buy({ owned: ['muszka'], worn: [] }, { stars: 50 }, 'muszka')).toMatchObject({ ok: false, reason: 'owned' })
  })

  it('swaps gadgets in the same spot and takes one off on a second tap', () => {
    let w: Wardrobe = { owned: ['czapka', 'korona'], worn: ['czapka'] }
    w = toggleWear(w, 'korona')
    expect(w.worn).toEqual(['korona'])
    w = toggleWear(w, 'korona')
    expect(w.worn).toEqual([])
    expect(toggleWear(w, 'medal')).toBe(w)
  })

  it('wears several things from one shelf when they sit in different spots', () => {
    let w: Wardrobe = { owned: ['balonik', 'plecak', 'kokardka', 'mis', 'parasolka', 'kokarda', 'korona', 'muszka', 'korale', 'szalik'], worn: [] }
    for (const id of ['balonik', 'plecak', 'kokardka', 'mis', 'kokarda', 'korona', 'muszka', 'korale']) w = toggleWear(w, id)
    expect(w.worn).toHaveLength(8)
    // Umbrella and balloon both go in the paw.
    w = toggleWear(w, 'parasolka')
    expect(w.worn).toContain('parasolka')
    expect(w.worn).not.toContain('balonik')
    // A scarf takes the place of both the bow tie and the beads.
    w = toggleWear(w, 'szalik')
    expect(w.worn).not.toContain('muszka')
    expect(w.worn).not.toContain('korale')
  })

  it('a dress replaces a shirt and a skirt, a vest goes on top', () => {
    expect(clash('sukienka', 'paski')).toBe(true)
    expect(clash('sukienka', 'spodniczka')).toBe(true)
    expect(clash('paski', 'spodniczka')).toBe(false)
    expect(wornList(['kamizelka', 'paski'])).toEqual(['paski', 'kamizelka'])
  })

  it('reads old saves that wore one gadget per shelf', () => {
    expect(wornList({ head: 'korona', neck: 'muszka', feet: 'nieznane' })).toEqual(expect.arrayContaining(['korona', 'muszka']))
    expect(wornList(undefined)).toEqual([])
  })

  it('aims at the cheapest gadget not owned yet', () => {
    expect(nextGoal(empty)?.price).toBe(3)
    expect(nextGoal({ owned: GADGETS.map((g) => g.id), worn: [] })).toBeNull()
  })

  it('has twelve gadgets on every shelf, each with a drawing', () => {
    for (const slot of SLOTS) expect(GADGETS.filter((g) => g.slot === slot)).toHaveLength(12)
    for (const g of GADGETS) expect(GADGET_ART[g.id], g.id).toBeTruthy()
  })

  it('has unique ids and prices a kid can reach', () => {
    expect(new Set(GADGETS.map((g) => g.id)).size).toBe(GADGETS.length)
    expect(Math.max(...GADGETS.map((g) => g.price))).toBeLessThanOrEqual(30)
  })
})
