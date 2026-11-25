/**
 * Smoczek's wardrobe: gadgets bought with stars.
 *
 * Every finished round pays 1 to 3 stars, about 10 stars for a 20-minute session.
 * Prices are set so the first gadget comes after one or two rounds, a few more after
 * a session, and the crown takes about a week of play. Six shelves of eight.
 */

export type Slot = 'head' | 'eyes' | 'neck' | 'body' | 'feet' | 'extra'

export interface Gadget {
  id: string
  /** Name Smoczek says, in Polish. */
  name: string
  slot: Slot
  price: number
}

export const SLOTS: Slot[] = ['head', 'eyes', 'neck', 'body', 'feet', 'extra']

/** Eight per shelf, cheapest first. */
export const GADGETS: Gadget[] = [
  { id: 'kokarda', name: 'Kokarda', slot: 'head', price: 3 },
  { id: 'czapka', name: 'Czapka z pomponem', slot: 'head', price: 4 },
  { id: 'daszek', name: 'Czapka z daszkiem', slot: 'head', price: 5 },
  { id: 'urodzinowa', name: 'Czapeczka urodzinowa', slot: 'head', price: 6 },
  { id: 'wianek', name: 'Wianek', slot: 'head', price: 8 },
  { id: 'kowboj', name: 'Kapelusz kowboja', slot: 'head', price: 12 },
  { id: 'czarodziej', name: 'Kapelusz czarodzieja', slot: 'head', price: 15 },
  { id: 'korona', name: 'Korona', slot: 'head', price: 25 },

  { id: 'okulary', name: 'Okulary', slot: 'eyes', price: 3 },
  { id: 'monokl', name: 'Monokl', slot: 'eyes', price: 5 },
  { id: 'sloneczne', name: 'Okulary przeciwsłoneczne', slot: 'eyes', price: 6 },
  { id: 'gogle', name: 'Gogle do pływania', slot: 'eyes', price: 7 },
  { id: 'gwiazdki', name: 'Gwiazdkowe okulary', slot: 'eyes', price: 8 },
  { id: 'maska', name: 'Maska bohatera', slot: 'eyes', price: 9 },
  { id: 'serduszka', name: 'Serduszkowe okulary', slot: 'eyes', price: 10 },
  { id: 'pilot', name: 'Gogle pilota', slot: 'eyes', price: 12 },

  { id: 'muszka', name: 'Muszka', slot: 'neck', price: 3 },
  { id: 'krawat', name: 'Krawat', slot: 'neck', price: 4 },
  { id: 'szalik', name: 'Szalik', slot: 'neck', price: 5 },
  { id: 'apaszka', name: 'Apaszka', slot: 'neck', price: 6 },
  { id: 'korale', name: 'Korale', slot: 'neck', price: 7 },
  { id: 'dzwonek', name: 'Dzwoneczek', slot: 'neck', price: 8 },
  { id: 'serduszko', name: 'Naszyjnik z serduszkiem', slot: 'neck', price: 10 },
  { id: 'medal', name: 'Złoty medal', slot: 'neck', price: 12 },

  { id: 'paski', name: 'Koszulka w paski', slot: 'body', price: 5 },
  { id: 'kamizelka', name: 'Kamizelka', slot: 'body', price: 6 },
  { id: 'spodniczka', name: 'Spódniczka', slot: 'body', price: 7 },
  { id: 'sweter', name: 'Sweterek z serduszkiem', slot: 'body', price: 8 },
  { id: 'tutu', name: 'Spódniczka baletnicy', slot: 'body', price: 9 },
  { id: 'sukienka', name: 'Sukienka', slot: 'body', price: 10 },
  { id: 'ogrodniczki', name: 'Ogrodniczki', slot: 'body', price: 11 },
  { id: 'frak', name: 'Frak', slot: 'body', price: 14 },

  { id: 'trampki', name: 'Trampki', slot: 'feet', price: 4 },
  { id: 'kalosze', name: 'Kalosze', slot: 'feet', price: 5 },
  { id: 'baletki', name: 'Baletki', slot: 'feet', price: 6 },
  { id: 'pletwy', name: 'Płetwy', slot: 'feet', price: 7 },
  { id: 'kapcie', name: 'Kapcie króliczki', slot: 'feet', price: 8 },
  { id: 'kowbojki', name: 'Kowbojki', slot: 'feet', price: 9 },
  { id: 'lyzwy', name: 'Łyżwy', slot: 'feet', price: 10 },
  { id: 'wrotki', name: 'Wrotki', slot: 'feet', price: 12 },

  { id: 'balonik', name: 'Balonik', slot: 'extra', price: 4 },
  { id: 'kokardka', name: 'Kokardka na ogon', slot: 'extra', price: 5 },
  { id: 'plecak', name: 'Plecak', slot: 'extra', price: 6 },
  { id: 'torebka', name: 'Torebka', slot: 'extra', price: 7 },
  { id: 'parasolka', name: 'Parasolka', slot: 'extra', price: 8 },
  { id: 'rozdzka', name: 'Różdżka', slot: 'extra', price: 10 },
  { id: 'skrzydla', name: 'Skrzydła motyla', slot: 'extra', price: 12 },
  { id: 'peleryna', name: 'Peleryna bohatera', slot: 'extra', price: 14 },
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
