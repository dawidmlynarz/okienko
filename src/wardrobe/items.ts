/**
 * Smoczek's wardrobe: gadgets bought with stars.
 *
 * Every finished round pays 1 to 3 stars, about 10 stars for a 20-minute session.
 * Prices are set so the first gadget comes after one or two rounds, a few more after
 * a session, and the crown takes about a week of play.
 */

export type Slot = 'head' | 'eyes' | 'neck' | 'extra'

export interface Gadget {
  id: string
  /** Name Smoczek says, in Polish. */
  name: string
  slot: Slot
  price: number
}

export const SLOTS: Slot[] = ['head', 'eyes', 'neck', 'extra']

export const GADGETS: Gadget[] = [
  { id: 'muszka', name: 'Muszka', slot: 'neck', price: 3 },
  { id: 'okulary', name: 'Okulary', slot: 'eyes', price: 3 },
  { id: 'czapka', name: 'Czapka z pomponem', slot: 'head', price: 4 },
  { id: 'balonik', name: 'Balonik', slot: 'extra', price: 4 },
  { id: 'szalik', name: 'Szalik', slot: 'neck', price: 5 },
  { id: 'kokardka', name: 'Kokardka na ogon', slot: 'extra', price: 5 },
  { id: 'urodzinowa', name: 'Czapeczka urodzinowa', slot: 'head', price: 6 },
  { id: 'sloneczne', name: 'Okulary przeciwsłoneczne', slot: 'eyes', price: 6 },
  { id: 'serduszka', name: 'Serduszkowe okulary', slot: 'eyes', price: 10 },
  { id: 'medal', name: 'Złoty medal', slot: 'neck', price: 12 },
  { id: 'peleryna', name: 'Peleryna bohatera', slot: 'extra', price: 14 },
  { id: 'czarodziej', name: 'Kapelusz czarodzieja', slot: 'head', price: 15 },
  { id: 'korona', name: 'Korona', slot: 'head', price: 25 },
]

export const gadgetById = (id: string | null | undefined) => GADGETS.find((g) => g.id === id) ?? null

export type Outfit = Partial<Record<Slot, string>>

export interface Wardrobe {
  owned: string[]
  worn: Outfit
}

/** Stars she can still spend. Earned stars are never taken away; spending is counted separately. */
export const balanceOf = (p: { stars: number; spent?: number }) => Math.max(0, p.stars - (p.spent ?? 0))

export type BuyResult = { ok: true; wardrobe: Wardrobe; spent: number } | { ok: false; reason: 'owned' | 'missing' | 'unknown'; short?: number }

/** Buy a gadget and put it on straight away. Pure, so the rules are testable. */
export function buy(wardrobe: Wardrobe, progress: { stars: number; spent?: number }, id: string): BuyResult {
  const g = gadgetById(id)
  if (!g) return { ok: false, reason: 'unknown' }
  if (wardrobe.owned.includes(id)) return { ok: false, reason: 'owned' }
  const have = balanceOf(progress)
  if (have < g.price) return { ok: false, reason: 'missing', short: g.price - have }
  return {
    ok: true,
    spent: (progress.spent ?? 0) + g.price,
    wardrobe: { owned: [...wardrobe.owned, id], worn: { ...wardrobe.worn, [g.slot]: id } },
  }
}

/** Put on an owned gadget, or take it off if he is already wearing it. */
export function toggleWear(wardrobe: Wardrobe, id: string): Wardrobe {
  const g = gadgetById(id)
  if (!g || !wardrobe.owned.includes(id)) return wardrobe
  const worn = { ...wardrobe.worn }
  if (worn[g.slot] === id) delete worn[g.slot]
  else worn[g.slot] = id
  return { ...wardrobe, worn }
}

/** The cheapest gadget she does not own yet: the next thing to save up for. */
export function nextGoal(wardrobe: Wardrobe): Gadget | null {
  return GADGETS.filter((g) => !wardrobe.owned.includes(g.id)).sort((a, b) => a.price - b.price)[0] ?? null
}
