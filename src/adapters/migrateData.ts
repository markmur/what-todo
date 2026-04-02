import { StorageAdapter } from "./StorageAdapter"

/**
 * Copy data from one storage adapter to another.
 * Returns true if data was migrated, false if the source was empty.
 * Throws if either the read or write fails, so callers can handle
 * the error and avoid leaving the user in a broken state.
 */
export async function migrateData(
  source: StorageAdapter,
  target: StorageAdapter
): Promise<boolean> {
  const data = await source.get()
  if (!data) {
    return false
  }

  await target.set(data)
  return true
}
