import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { PictureId } from '../assets/pictures'
import { pl } from '../i18n/pl'

/** The accent slot an app's window uses. Matches [data-app] in tokens.css. */
export type AppAccent = 'system' | 'typing' | 'english' | 'maths' | 'notes' | 'web' | 'shop'

export interface AppDef {
  id: string
  name: string
  /** One short line under the name on the home tile. */
  blurb: string
  icon: PictureId
  accent: AppAccent
  kind: 'game' | 'tool'
  /** Companion who hosts this app. Only Smoczek for now. */
  host: 'smoczek'
  component: LazyExoticComponent<ComponentType<AppProps>>
}

export interface AppProps {
  /** Ask the frame to close the app. Apps with unsaved work can intercept via the frame's guard. */
  close: () => void
}

/** Every app is one entry. Home, the tiles and (later) windows all read this list. */
export const apps: AppDef[] = [
  { id: 'balonowy-las', name: pl.apps.typing, blurb: pl.appBlurb.typing, icon: 'balon', accent: 'typing', kind: 'game', host: 'smoczek', component: lazy(() => import('./balonowy-las/BalonowyLas')) },
  { id: 'obrazkowe-slowa', name: pl.apps.words, blurb: pl.appBlurb.words, icon: 'obrazek', accent: 'english', kind: 'game', host: 'smoczek', component: lazy(() => import('./obrazkowe-slowa/ObrazkoweSlowa')) },
  { id: 'lap-biedronki', name: pl.apps.ladybugs, blurb: pl.appBlurb.ladybugs, icon: 'biedronka', accent: 'web', kind: 'game', host: 'smoczek', component: lazy(() => import('./lap-biedronki/LapBiedronki')) },
  { id: 'smocze-memory', name: pl.apps.memory, blurb: pl.appBlurb.memory, icon: 'karty', accent: 'system', kind: 'game', host: 'smoczek', component: lazy(() => import('./smocze-memory/SmoczeMemory')) },
  { id: 'liczymy-jablka', name: pl.apps.counting, blurb: pl.appBlurb.counting, icon: 'jablko', accent: 'maths', kind: 'game', host: 'smoczek', component: lazy(() => import('./liczymy-jablka/LiczymyJablka')) },
  { id: 'konik', name: pl.apps.konik, blurb: pl.appBlurb.konik, icon: 'konik', accent: 'typing', kind: 'game', host: 'smoczek', component: lazy(() => import('./konik/Konik')) },
  { id: 'labirynt', name: pl.apps.maze, blurb: pl.appBlurb.maze, icon: 'ser', accent: 'maths', kind: 'game', host: 'smoczek', component: lazy(() => import('./labirynt/Labirynt')) },
  {
    id: 'szafa',
    // The shop is named after the friend she picked: "Szafa Smoczka", "Szafa Konika"…
    get name() {
      return pl.apps.wardrobe
    },
    get blurb() {
      return pl.appBlurb.wardrobe
    },
    icon: 'korona', accent: 'shop', kind: 'tool', host: 'smoczek', component: lazy(() => import('./szafa/Szafa')) },
  { id: 'notatnik', name: pl.apps.notes, blurb: pl.appBlurb.notes, icon: 'notes', accent: 'notes', kind: 'tool', host: 'smoczek', component: lazy(() => import('./notatnik/Notatnik')) },
]

export const appById = (id: string | null) => apps.find((a) => a.id === id) ?? null
