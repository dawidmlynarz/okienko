/**
 * Who keeps her company. Every friend is the same bean body (so the whole wardrobe fits),
 * with its own ears, tail and colours. The dragon also takes the colour picked in setup.
 */
export type Species = 'smok' | 'konik' | 'koala' | 'piesek'

export const SPECIES: Species[] = ['smok', 'konik', 'koala', 'piesek']

/** Name and the forms Polish sentences need: "Szafa Smoczka", "Kliknij Smoczka". */
export const FRIEND: Record<Species, { name: string; gen: string }> = {
  smok: { name: 'Smoczek', gen: 'Smoczka' },
  konik: { name: 'Konik', gen: 'Konika' },
  koala: { name: 'Koala', gen: 'Koali' },
  piesek: { name: 'Piesek', gen: 'Pieska' },
}

/** The friend currently shown. Kept in sync with the profile so plain strings can use it. */
export const current = { species: 'smok' as Species }
export const friendName = () => FRIEND[current.species].name
export const friendGen = () => FRIEND[current.species].gen
