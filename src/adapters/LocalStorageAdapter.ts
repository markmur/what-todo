import { Data } from "../index.d"
import { StorageAdapter } from "./StorageAdapter"

const STORAGE_KEY = "what-todo"

/**
 * Stores data in the browser's localStorage as a single JSON blob.
 * This is the default backend and requires no setup.
 */
export class LocalStorageAdapter implements StorageAdapter {
  async get(): Promise<Data | null> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Data
    } catch {
      return null
    }
  }

  async set(data: Data): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }
}
