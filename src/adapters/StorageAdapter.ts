import { Data } from "../index.d"

/**
 * Common interface for all storage backends.
 *
 * Both LocalStorageAdapter and SupabaseStorageAdapter conform to this
 * contract so StorageManager can swap backends without changing any
 * business logic.
 */
export interface StorageAdapter {
  /** Read the full data blob. Returns null when no data exists yet. */
  get(): Promise<Data | null>

  /** Persist the full data blob, overwriting whatever was stored before. */
  set(data: Data): Promise<void>

  /** Delete all stored data. */
  clear(): Promise<void>

  /**
   * Verify the adapter can connect to its backend.
   * Throws with a descriptive message if the connection fails.
   * Adapters that don't need connection testing (e.g. localStorage)
   * can omit this — callers should check before invoking.
   */
  testConnection?(): Promise<void>
}
