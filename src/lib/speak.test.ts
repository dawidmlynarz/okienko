import { describe, expect, it } from 'vitest'
import { phrases, voiceScore } from './speak'

describe('voice', () => {
  it('prefers premium and online voices over the basic ones', () => {
    const v = (name: string) => voiceScore({ name, localService: true })
    expect(v('Ewa (Premium)')).toBeGreaterThan(v('Zosia'))
    expect(v('Zosia (Enhanced)')).toBeGreaterThan(v('Zosia'))
    expect(v('Google polski')).toBeGreaterThan(v('Microsoft Paulina - Polish (Poland)'))
    expect(v('Zosia')).toBeGreaterThan(v('Microsoft Paulina - Polish (Poland)'))
  })

  it('splits text into sentences for natural pauses', () => {
    expect(phrases('Cześć! Jestem Smoczek. Wpisz swoje imię…')).toEqual(['Cześć!', 'Jestem Smoczek.', 'Wpisz swoje imię.'])
    expect(phrases('Mam smoka\nLubi czytać')).toEqual(['Mam smoka', 'Lubi czytać'])
  })
})
