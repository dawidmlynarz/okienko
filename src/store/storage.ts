import { createJSONStorage, type StateStorage } from 'zustand/middleware'

/**
 * The one place Smoczy Domek touches browser storage. Today it is localStorage;
 * swapping to IndexedDB later means writing another StateStorage here.
 */
// Kept from the project's first name so saved progress survives the rename.
export const STORAGE_KEY = 'okienko'
export const SCHEMA_VERSION = 1

const memory = new Map<string, string>()

const safeLocalStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return memory.get(k) ?? null
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      memory.set(k, v)
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      memory.delete(k)
    }
  },
}

export const storage = createJSONStorage(() => safeLocalStorage)

/** Ask the browser not to evict our data when disk is low. Best effort. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) {
      await navigator.storage.persist?.()
    }
  } catch {
    /* not supported, fine */
  }
}

/**
 * Upgrade saved data from older schema versions. Add a case per version bump,
 * never edit an old one.
 */
export function migrate(persisted: unknown, fromVersion: number): unknown {
  const state = (persisted ?? {}) as Record<string, unknown>
  switch (fromVersion) {
    case 0:
    // v0 never shipped; fall through to current.
    default:
      return state
  }
}
