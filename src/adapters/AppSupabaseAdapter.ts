import { Data } from "../index.d"
import { StorageAdapter } from "./StorageAdapter"
import { supabase } from "../lib/supabase"

const TABLE = "todos"

/**
 * Stores data in the what-todo.app Supabase project.
 * Used when the user is authenticated but has not connected
 * their own Supabase project (the default authenticated tier).
 *
 * Each user has one row in the todos table, keyed by their
 * auth.uid(). RLS ensures users can only access their own row.
 */
export class AppSupabaseAdapter implements StorageAdapter {
  private get client() {
    if (!supabase) throw new Error("Supabase is not configured")
    return supabase
  }

  async get(): Promise<Data | null> {
    const {
      data: { user }
    } = await this.client.auth.getUser()
    if (!user) return null

    const { data, error } = await this.client
      .from(TABLE)
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error)
      throw new Error(`AppSupabaseAdapter get failed: ${error.message}`)

    return (data?.data as Data) ?? null
  }

  async set(newData: Data): Promise<void> {
    const {
      data: { user }
    } = await this.client.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await this.client.from(TABLE).upsert(
      {
        user_id: user.id,
        data: newData,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    )

    if (error)
      throw new Error(`AppSupabaseAdapter set failed: ${error.message}`)
  }

  async clear(): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().neq("user_id", "")

    if (error)
      throw new Error(`AppSupabaseAdapter clear failed: ${error.message}`)
  }
}
