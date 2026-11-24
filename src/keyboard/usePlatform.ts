import { useMemo } from 'react'
import { useDomek } from '../store/useDomek'
import { detectPlatform, type Platform } from './polish'

/** The keyboard to draw: the parent's choice, or a guess from the browser. */
export function usePlatform(): Platform {
  const choice = useDomek((s) => s.settings.keyboard ?? 'auto')
  return useMemo(() => (choice === 'auto' ? detectPlatform() : choice), [choice])
}
