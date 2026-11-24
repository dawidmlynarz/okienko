import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PictureId } from '../assets/pictures'
import { buy, toggleWear, type BuyResult, type Wardrobe } from '../wardrobe/items'
import { SCHEMA_VERSION, STORAGE_KEY, migrate, storage } from './storage'

export type CompanionColor = 'mint' | 'sky' | 'lavender' | 'peach' | 'pink'
export type Wallpaper = 'day' | 'sunset'

export interface Profile {
  childName: string
  companionName: string
  companionColor: CompanionColor
  /** Picture-PIN, 3 pictures in order. Null until she picks one on first login. */
  pin: PictureId[] | null
}

export interface Note {
  id: string
  body: string
  createdAt: number
  updatedAt: number
}

export interface Progress {
  /** Every star ever earned. Spending never lowers it. */
  stars: number
  /** Stars spent in Smoczek's wardrobe. The wallet is stars - spent. */
  spent?: number
  starsByDay: Record<string, number>
  /** Best stars per typing level id. */
  levels: Record<string, number>
  rounds: number
}

export interface Settings {
  sound: boolean
  voice: boolean
  voiceName: string | null
  wallpaper: Wallpaper
  /** Which keyboard to draw. 'auto' guesses from the browser. */
  keyboard?: 'auto' | 'mac' | 'win'
}

export interface PersistedState {
  schemaVersion: number
  profile: Profile | null
  settings: Settings
  progress: Progress
  wardrobe: Wardrobe
  notes: Note[]
}

export type Screen = 'setup' | 'login' | 'home' | 'app'

interface SessionState {
  screen: Screen
  openApp: string | null
  parentOpen: boolean
}

interface Actions {
  completeSetup: (p: Omit<Profile, 'pin'>) => void
  updateProfile: (p: Partial<Profile>) => void
  setPin: (pin: PictureId[] | null) => void
  login: () => void
  logout: () => void
  launch: (appId: string) => void
  goHome: () => void
  setParentOpen: (open: boolean) => void
  toggleSound: () => void
  setSettings: (s: Partial<Settings>) => void
  addStars: (levelId: string, stars: number) => void
  buyGadget: (id: string) => BuyResult
  toggleGadget: (id: string) => void
  saveNote: (id: string | null, body: string) => string
  deleteNote: (id: string) => void
  importData: (data: unknown) => boolean
  exportData: () => PersistedState
  resetAll: () => void
}

export type DomekState = PersistedState & SessionState & Actions

/** The companion's name. Not asked any more: everyone knows him as Smoczek. */
export const COMPANION_NAME = 'Smoczek'

export const today = () => new Date().toISOString().slice(0, 10)

const initialData = (): PersistedState => ({
  schemaVersion: SCHEMA_VERSION,
  profile: null,
  settings: { sound: true, voice: true, voiceName: null, wallpaper: 'day', keyboard: 'auto' },
  progress: { stars: 0, spent: 0, starsByDay: {}, levels: {}, rounds: 0 },
  wardrobe: { owned: [], worn: {} },
  notes: [],
})

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const useDomek = create<DomekState>()(
  persist(
    (set, get) => ({
      ...initialData(),
      screen: 'setup',
      openApp: null,
      parentOpen: false,

      completeSetup: (p) => set({ profile: { ...p, pin: get().profile?.pin ?? null }, screen: 'login' }),
      updateProfile: (p) => set((s) => (s.profile ? { profile: { ...s.profile, ...p } } : {})),
      setPin: (pin) => set((s) => (s.profile ? { profile: { ...s.profile, pin } } : {})),
      login: () => set({ screen: 'home', openApp: null }),
      logout: () => set({ screen: 'login', openApp: null }),
      launch: (appId) => set({ screen: 'app', openApp: appId }),
      goHome: () => set({ screen: 'home', openApp: null }),
      setParentOpen: (parentOpen) => set({ parentOpen }),
      toggleSound: () => set((s) => ({ settings: { ...s.settings, sound: !s.settings.sound } })),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      addStars: (levelId, stars) =>
        set((s) => {
          const d = today()
          return {
            progress: {
              ...s.progress,
              stars: s.progress.stars + stars,
              starsByDay: { ...s.progress.starsByDay, [d]: (s.progress.starsByDay[d] ?? 0) + stars },
              levels: { ...s.progress.levels, [levelId]: Math.max(stars, s.progress.levels[levelId] ?? 0) },
              rounds: s.progress.rounds + 1,
            },
          }
        }),

      buyGadget: (id) => {
        const { wardrobe, progress } = get()
        const r = buy(wardrobe ?? { owned: [], worn: {} }, progress, id)
        if (r.ok) set({ wardrobe: r.wardrobe, progress: { ...progress, spent: r.spent } })
        return r
      },
      toggleGadget: (id) => set((s) => ({ wardrobe: toggleWear(s.wardrobe ?? { owned: [], worn: {} }, id) })),

      saveNote: (id, body) => {
        const now = Date.now()
        if (id && get().notes.some((n) => n.id === id)) {
          set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, body, updatedAt: now } : n)) }))
          return id
        }
        const newId = uid()
        set((s) => ({ notes: [{ id: newId, body, createdAt: now, updatedAt: now }, ...s.notes] }))
        return newId
      },
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      exportData: () => {
        const { schemaVersion, profile, settings, progress, wardrobe, notes } = get()
        return { schemaVersion, profile, settings, progress, wardrobe, notes }
      },
      importData: (data) => {
        if (!data || typeof data !== 'object') return false
        const d = data as Partial<PersistedState> & { app?: string }
        if (d.app !== 'okienko' || typeof d.schemaVersion !== 'number' || !('progress' in d)) return false
        const migrated = migrate(d, d.schemaVersion) as Partial<PersistedState>
        const base = initialData()
        set({
          ...base,
          ...migrated,
          settings: { ...base.settings, ...migrated.settings },
          progress: { ...base.progress, ...migrated.progress },
          wardrobe: { ...base.wardrobe, ...migrated.wardrobe },
          schemaVersion: SCHEMA_VERSION,
          screen: migrated.profile ? 'login' : 'setup',
          openApp: null,
        })
        return true
      },
      resetAll: () => set({ ...initialData(), screen: 'setup', openApp: null, parentOpen: false }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: SCHEMA_VERSION,
      migrate,
      partialize: (s): PersistedState => ({
        schemaVersion: s.schemaVersion,
        profile: s.profile,
        settings: s.settings,
        progress: s.progress,
        wardrobe: s.wardrobe,
        notes: s.notes,
      }),
    },
  ),
)

/** Where a fresh page load starts: setup until a parent has set it up, then login. */
export function startScreen() {
  const s = useDomek.getState()
  useDomek.setState({ screen: s.profile ? 'login' : 'setup', openApp: null })
}

/** The backup file format: persisted state plus a marker so we can recognise our own files. */
export function backupFile() {
  return JSON.stringify({ app: 'okienko', exportedAt: new Date().toISOString(), ...useDomek.getState().exportData() }, null, 2)
}

export const starsToday = (p: Progress) => p.starsByDay[today()] ?? 0
