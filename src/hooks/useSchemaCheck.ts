import { SCHEMA_VERSION } from "../StorageManager"
import { Data } from "../index.d"

/**
 * Returns true if the loaded data has a schema version older than the current
 * app version. Only relevant for users who bring their own Supabase — their DB
 * schema may be out of date and require a manual migration.
 */
export function useSchemaCheck(data: Data, isCustomSupabase: boolean): boolean {
  if (!isCustomSupabase) return false
  return (data.schemaVersion ?? 0) < SCHEMA_VERSION
}
