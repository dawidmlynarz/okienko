/**
 * Smoczek's wardrobe: gadgets bought with stars.
 *
 * Every finished round pays 1 to 3 stars, about 10 stars for a 20-minute session.
 * Prices are set so the first gadget comes after one or two rounds, a few more after
 * a session, and the crown takes about a week of play. Five shelves of twelve to wear,
 * one of things to hold in the paw, one of things on the back.
 *
 * She can wear as many things as she likes, from any shelf. Only things that sit in the
 * same spot push each other off: two hats, two pairs of glasses, a dress and a skirt.
 */

export type Slot = 'head' | 'eyes' | 'neck' | 'body' | 'feet' | 'hand' | 'back'

export interface Gadget {
  id: string
  /** Name Smoczek says, in Polish. */
  name: string
  slot: Slot
  price: number
  /** Where it sits on him. Two gadgets that share a spot cannot be worn together. */
  spots: string[]
  /** Drawing order among worn gadgets, low first (a vest goes over a shirt, an apron over both). */
  z?: number
}

export const SLOTS: Slot[] = ['head', 'eyes', 'neck', 'body', 'feet', 'hand', 'back']

const g = (id: string, name: string, slot: Slot, price: number, spots: string[] = [slot], z = 0): Gadget => ({ id, name, slot, price, spots, z })

/** Cheapest first on every shelf. */
export const GADGETS: Gadget[] = [
  g('kokarda', 'Kokarda', 'head', 3, ['bow']),
  g('spinki', 'Spinki z serduszkami', 'head', 4, ['clips']),
  g('czapka', 'Czapka z pomponem', 'head', 4, ['hat']),
  g('daszek', 'Czapka z daszkiem', 'head', 5, ['hat']),
  g('urodzinowa', 'Czapeczka urodzinowa', 'head', 6, ['hat']),
  g('kurczak', 'Kurczaczek na głowie', 'head', 7, ['hat']),
  g('wianek', 'Wianek', 'head', 8, ['hat']),
  g('kowboj', 'Kapelusz kowboja', 'head', 12, ['hat']),
  g('jednorozec', 'Róg jednorożca', 'head', 13, ['hat']),
  g('czarodziej', 'Kapelusz czarodzieja', 'head', 15, ['hat']),
  g('tiara', 'Tiara księżniczki', 'head', 18, ['hat']),
  g('korona', 'Korona', 'head', 25, ['hat']),

  g('okulary', 'Okulary', 'eyes', 3),
  g('rzesy', 'Długie rzęsy', 'eyes', 4, ['lashes'], -1),
  g('monokl', 'Monokl', 'eyes', 5),
  g('sloneczne', 'Okulary przeciwsłoneczne', 'eyes', 6),
  g('gogle', 'Gogle do pływania', 'eyes', 7),
  g('kwiatki', 'Okulary stokrotki', 'eyes', 8),
  g('gwiazdki', 'Gwiazdkowe okulary', 'eyes', 8),
  g('kotki', 'Okulary kotki', 'eyes', 9),
  g('maska', 'Maska bohatera', 'eyes', 9),
  g('serduszka', 'Serduszkowe okulary', 'eyes', 10),
  g('wasy', 'Okulary z wąsami', 'eyes', 11),
  g('pilot', 'Gogle pilota', 'eyes', 12),

  g('muszka', 'Muszka', 'neck', 3, ['collar'], 1),
  g('krawat', 'Krawat', 'neck', 4, ['collar'], 1),
  g('szalik', 'Szalik', 'neck', 5, ['collar', 'chain']),
  g('apaszka', 'Apaszka', 'neck', 6, ['collar'], 1),
  g('perelki', 'Perełki', 'neck', 6, ['chain'], 2),
  g('korale', 'Korale', 'neck', 7, ['chain'], 2),
  g('kolnierzyk', 'Kołnierzyk z falbanką', 'neck', 7, ['collar']),
  g('dzwonek', 'Dzwoneczek', 'neck', 8, ['chain'], 2),
  g('boa', 'Boa z piórek', 'neck', 9, ['collar', 'chain'], 3),
  g('sliniak', 'Śliniaczek z kaczuszką', 'neck', 9, ['collar']),
  g('serduszko', 'Naszyjnik z serduszkiem', 'neck', 10, ['chain'], 2),
  g('medal', 'Złoty medal', 'neck', 12, ['medal'], 3),

  g('paski', 'Koszulka w paski', 'body', 5, ['top']),
  g('teczowa', 'Koszulka z tęczą', 'body', 6, ['top']),
  g('kamizelka', 'Kamizelka', 'body', 6, ['vest'], 2),
  g('spodniczka', 'Spódniczka', 'body', 7, ['skirt'], 1),
  g('fartuszek', 'Fartuszek z babeczką', 'body', 8, ['apron'], 3),
  g('sweter', 'Sweterek z serduszkiem', 'body', 8, ['top']),
  g('tutu', 'Spódniczka baletnicy', 'body', 9, ['skirt'], 1),
  g('kolo', 'Koło z kaczuszką', 'body', 9, ['ring', 'apron'], 4),
  g('sukienka', 'Sukienka', 'body', 10, ['top', 'skirt']),
  g('ogrodniczki', 'Ogrodniczki', 'body', 11, ['top', 'skirt', 'vest']),
  g('frak', 'Frak', 'body', 14, ['top', 'skirt', 'vest', 'apron']),
  g('ksiezniczka', 'Suknia księżniczki', 'body', 16, ['top', 'skirt', 'vest']),

  g('trampki', 'Trampki', 'feet', 4),
  g('skarpetki', 'Skarpetki nie do pary', 'feet', 5),
  g('kalosze', 'Kalosze', 'feet', 5),
  g('baletki', 'Baletki', 'feet', 6),
  g('pletwy', 'Płetwy', 'feet', 7),
  g('kapcie', 'Kapcie króliczki', 'feet', 8),
  g('pantofelki', 'Brokatowe pantofelki', 'feet', 9),
  g('kowbojki', 'Kowbojki', 'feet', 9),
  g('kozaczki', 'Puchate kozaczki', 'feet', 10),
  g('lyzwy', 'Łyżwy', 'feet', 10),
  g('klaun', 'Buty klauna', 'feet', 11),
  g('wrotki', 'Wrotki', 'feet', 12),

  // One paw, so one thing at a time.
  g('balonik', 'Balonik', 'hand', 4),
  g('lizak', 'Lizak', 'hand', 5),
  g('lody', 'Lody', 'hand', 6),
  g('torebka', 'Torebka', 'hand', 7),
  g('banki', 'Bańki mydlane', 'hand', 8),
  g('parasolka', 'Parasolka', 'hand', 8),
  g('mis', 'Pluszowy miś', 'hand', 9),
  g('rozdzka', 'Różdżka', 'hand', 10),

  // On the back. The tail bow goes with anything; wings, capes and bags take the whole back.
  g('kokardka', 'Kokardka na ogon', 'back', 4, ['tail']),
  g('plecak', 'Plecak', 'back', 6),
  g('kotek', 'Plecak kotek', 'back', 7),
  g('zolw', 'Skorupa żółwia', 'back', 9),
  g('skrzydla', 'Skrzydła motyla', 'back', 10),
  g('wrozka', 'Skrzydła wróżki', 'back', 12),
  g('rakieta', 'Plecak rakieta', 'back', 13),
  g('peleryna', 'Peleryna bohatera', 'back', 14),
]

export const gadgetById = (id: string | null | undefined) => GADGETS.find((g) => g.id === id) ?? null

/** What he has on: gadget ids, in drawing order. */
export type Outfit = string[]

export interface Wardrobe {
  owned: string[]
  worn: Outfit
}

const ORDER = new Map(GADGETS.map((x, i) => [x.id, i]))
const zOf = (id: string) => gadgetById(id)?.z ?? 0

/**
 * Read a saved outfit. Older saves kept one gadget per shelf ({ head: 'czapka' }); now it is a list.
 * Unknown ids are dropped, and the list comes back in drawing order.
 */
export function wornList(worn: unknown): Outfit {
  const ids = Array.isArray(worn) ? worn : worn && typeof worn === 'object' ? Object.values(worn) : []
  return sortOutfit(ids.filter((id): id is string => typeof id === 'string' && ORDER.has(id)))
}

/** Drawing order: by z, then by place in the catalogue. */
export const sortOutfit = (ids: string[]) => [...new Set(ids)].sort((a, b) => zOf(a) - zOf(b) || ORDER.get(a)! - ORDER.get(b)!)

/** Does wearing these two at once make sense? Not if they sit in the same spot. */
export function clash(a: string, b: string) {
  const ga = gadgetById(a)
  const gb = gadgetById(b)
  return !!ga && !!gb && a !== b && ga.spots.some((s) => gb.spots.includes(s))
}

/** Put a gadget on: whatever sat in the same spot comes off. */
export function putOn(worn: unknown, id: string): Outfit {
  return sortOutfit([...wornList(worn).filter((w) => !clash(w, id)), id])
}

/** Stars she can still spend. Earned stars are never taken away; spending is counted separately. */
export const balanceOf = (p: { stars: number; spent?: number }) => Math.max(0, p.stars - (p.spent ?? 0))

export type BuyResult = { ok: true; wardrobe: Wardrobe; spent: number } | { ok: false; reason: 'owned' | 'missing' | 'unknown'; short?: number }

/** Buy a gadget and put it on straight away. Pure, so the rules are testable. */
export function buy(wardrobe: Wardrobe, progress: { stars: number; spent?: number }, id: string): BuyResult {
  const item = gadgetById(id)
  if (!item) return { ok: false, reason: 'unknown' }
  if (wardrobe.owned.includes(id)) return { ok: false, reason: 'owned' }
  const have = balanceOf(progress)
  if (have < item.price) return { ok: false, reason: 'missing', short: item.price - have }
  return {
    ok: true,
    spent: (progress.spent ?? 0) + item.price,
    wardrobe: { owned: [...wardrobe.owned, id], worn: putOn(wardrobe.worn, id) },
  }
}

/** Put on an owned gadget, or take it off if he is already wearing it. */
export function toggleWear(wardrobe: Wardrobe, id: string): Wardrobe {
  if (!gadgetById(id) || !wardrobe.owned.includes(id)) return wardrobe
  const worn = wornList(wardrobe.worn)
  return { ...wardrobe, worn: worn.includes(id) ? worn.filter((w) => w !== id) : putOn(worn, id) }
}

/** The cheapest gadget she does not own yet: the next thing to save up for. */
export function nextGoal(wardrobe: Wardrobe): Gadget | null {
  return GADGETS.filter((x) => !wardrobe.owned.includes(x.id)).sort((a, b) => a.price - b.price)[0] ?? null
}
