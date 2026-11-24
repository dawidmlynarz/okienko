import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { PictureId } from '../assets/pictures'
import { pl } from '../i18n/pl'

/** The accent slot an app's window uses. Matches [data-app] in tokens.css. */
export type AppAccent = 'system' | 'typing' | 'english' | 'maths' | 'notes' | 'web'

export interface AppDef {
  id: string
  name: string
  icon: PictureId
  accent: AppAccent
  /** Companion who hosts this app. Only Smoczek in the PoC. */
  host: 'smoczek'
  component: LazyExoticComponent<ComponentType<AppProps>>
}

export interface AppProps {
  /** Ask the frame to close the app. Apps with unsaved work can intercept via the frame's guard. */
  close: () => void
}

/** Every app is one entry. Home, the dock and (later) windows all read this list. */
export const apps: AppDef[] = [
  {
    id: 'balonowy-las',
    name: pl.apps.typing,
    icon: 'balon',
    accent: 'typing',
    host: 'smoczek',
    component: lazy(() => import('./balonowy-las/BalonowyLas')),
  },
  {
    id: 'notatnik',
    name: pl.apps.notes,
    icon: 'notes',
    accent: 'notes',
    host: 'smoczek',
    component: lazy(() => import('./notatnik/Notatnik')),
  },
]

export const appById = (id: string | null) => apps.find((a) => a.id === id) ?? null
