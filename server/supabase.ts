import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { Data } from "../src/index.d"

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseConfigured = !!(SUPABASE_URL && SERVICE_ROLE_KEY)

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Supabase mode"
    )
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  }
  return _client
}

/**
 * Validate an API token and return the user's ID, or null if invalid.
 */
export async function validateApiToken(token: string): Promise<string | null> {
  const { data, error } = await getClient()
    .from("users")
    .select("id")
    .eq("api_token", token)
    .maybeSingle()

  if (error || !data) return null
  return data.id as string
}

/**
 * Read the full data blob for a user.
 */
export async function getData(userId: string): Promise<Data | null> {
  const { data, error } = await getClient()
    .from("todos")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(`Failed to read todos: ${error.message}`)
  return (data?.data as Data) ?? null
}

/**
 * Write the full data blob for a user.
 */
export async function setData(userId: string, newData: Data): Promise<void> {
  const { error } = await getClient()
    .from("todos")
    .upsert(
      { user_id: userId, data: newData, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )

  if (error) throw new Error(`Failed to write todos: ${error.message}`)
}
