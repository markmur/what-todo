/**
 * Helpers for persisting the user's Supabase connection details in
 * localStorage.  These are read on startup to decide which adapter
 * to use and surfaced in the "Connect Supabase" panel.
 *
 * Note: The anon key is a *public* client-side credential in
 * Supabase's auth model (it is shipped in every browser app that
 * uses Supabase). Real authorization comes from Row Level Security
 * policies on the database. Storing it in localStorage carries the
 * same risk profile as any other client-side state — an XSS
 * vulnerability could read it, but the anon key alone does not
 * bypass RLS.
 */

import { isValidSupabaseUrl } from "./SupabaseStorageAdapter"

const CONFIG_KEY = "what-todo-supabase-config"

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const raw = localStorage.getItem(CONFIG_KEY)
  if (!raw) return null
  try {
    const config = JSON.parse(raw) as SupabaseConfig
    // Validate stored config is still well-formed
    if (
      typeof config.url !== "string" ||
      typeof config.anonKey !== "string" ||
      !config.url ||
      !config.anonKey
    ) {
      return null
    }
    return config
  } catch {
    return null
  }
}

export function setSupabaseConfig(config: SupabaseConfig): void {
  if (!config.url || !config.anonKey) {
    throw new Error("Supabase URL and anon key are required")
  }
  if (!isValidSupabaseUrl(config.url)) {
    throw new Error(
      `Invalid Supabase URL: "${config.url}". Expected https://<project>.supabase.co`
    )
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(CONFIG_KEY)
}
