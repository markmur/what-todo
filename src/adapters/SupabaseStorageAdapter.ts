import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { Data } from "../index.d"
import { StorageAdapter } from "./StorageAdapter"

const TABLE = "what_todo_data"

/**
 * Fixed row key — all devices share a single row.
 *
 * The intended use case is one Supabase project per user, so there
 * is exactly one row. Cross-device sync works because every device
 * reads and writes the same row. Security comes from the fact that
 * only the user knows their project URL + anon key.
 *
 * Trade-off: last-write-wins. If two devices edit simultaneously,
 * the last save wins. Acceptable for a personal todo app; real-time
 * conflict resolution is a future enhancement.
 */
const ROW_ID = "default"

/** Validate that a URL looks like a Supabase project URL. */
export function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co")
    )
  } catch {
    return false
  }
}

/**
 * Error thrown when a Supabase operation fails.
 * Distinguishes network/backend errors from "no data" (null).
 */
export class SupabaseStorageError extends Error {
  constructor(
    operation: string,
    public readonly cause: unknown
  ) {
    super(`Supabase ${operation} failed: ${cause}`)
    this.name = "SupabaseStorageError"
  }
}

/**
 * Cache of Supabase clients keyed by URL+key to avoid creating
 * duplicate clients, auth listeners, and realtime channels.
 */
const clientCache = new Map<string, SupabaseClient>()

function getOrCreateClient(url: string, anonKey: string): SupabaseClient {
  const cacheKey = `${url}::${anonKey}`
  let client = clientCache.get(cacheKey)
  if (!client) {
    client = createClient(url, anonKey)
    clientCache.set(cacheKey, client)
  }
  return client
}

/**
 * Stores data in a user-provided Supabase instance.
 *
 * The full Data blob is kept as a single JSONB column so the schema
 * stays simple and mirrors what localStorage already does. All
 * devices share one row keyed by a fixed id ("default"), enabling
 * cross-device access.
 *
 * Security model: the user's Supabase project URL and anon key act
 * as the credentials. Only someone who knows both can read or write
 * the data. The anon key is not public — the user enters it manually
 * on each device they want to sync.
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private client: SupabaseClient

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    if (!isValidSupabaseUrl(supabaseUrl)) {
      throw new Error(
        `Invalid Supabase URL: "${supabaseUrl}". ` +
          "Expected https://<project>.supabase.co"
      )
    }

    this.client = getOrCreateClient(supabaseUrl, supabaseAnonKey)
  }

  async get(): Promise<Data | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle()

    if (error) {
      throw new SupabaseStorageError("get", error.message)
    }

    return (data?.data as Data) ?? null
  }

  async set(newData: Data): Promise<void> {
    const { error } = await this.client.from(TABLE).upsert({
      id: ROW_ID,
      data: newData,
      updated_at: new Date().toISOString()
    })

    if (error) {
      throw new SupabaseStorageError("set", error.message)
    }
  }

  async clear(): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq("id", ROW_ID)

    if (error) {
      throw new SupabaseStorageError("clear", error.message)
    }
  }

  /**
   * Test the connection by attempting a simple select.
   * Throws if the table doesn't exist or the credentials are wrong.
   */
  async testConnection(): Promise<void> {
    const { error } = await this.client.from(TABLE).select("id").limit(1)

    if (error) {
      throw new Error(
        `Could not connect to Supabase: ${error.message}. ` +
          `Make sure the "${TABLE}" table exists and RLS policies are configured.`
      )
    }
  }
}
