import { describe, it, expect, beforeEach } from "vitest"
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig
} from "../supabaseConfig"

const CONFIG_KEY = "what-todo-supabase-config"

describe("supabaseConfig", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns null when no config exists", () => {
    expect(getSupabaseConfig()).toBeNull()
  })

  it("stores and retrieves config", () => {
    setSupabaseConfig({
      url: "https://test.supabase.co",
      anonKey: "key123"
    })

    const config = getSupabaseConfig()
    expect(config).toEqual({
      url: "https://test.supabase.co",
      anonKey: "key123"
    })
  })

  it("clears config", () => {
    setSupabaseConfig({
      url: "https://test.supabase.co",
      anonKey: "key123"
    })
    clearSupabaseConfig()

    expect(getSupabaseConfig()).toBeNull()
    expect(localStorage.getItem(CONFIG_KEY)).toBeNull()
  })

  it("returns null for corrupt JSON", () => {
    localStorage.setItem(CONFIG_KEY, "not json")
    expect(getSupabaseConfig()).toBeNull()
  })

  it("returns null for config with missing fields", () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ url: "" }))
    expect(getSupabaseConfig()).toBeNull()
  })

  it("throws for invalid Supabase URL", () => {
    expect(() =>
      setSupabaseConfig({ url: "http://evil.com", anonKey: "key" })
    ).toThrow(/Invalid Supabase URL/)
  })

  it("throws for empty fields", () => {
    expect(() => setSupabaseConfig({ url: "", anonKey: "" })).toThrow(
      /required/
    )
  })
})
