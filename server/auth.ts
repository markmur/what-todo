import crypto from "node:crypto"
import type { RequestHandler } from "express"
import { validateApiToken, isSupabaseConfigured } from "./supabase.js"

/**
 * Fallback token for relay mode (no Supabase configured).
 * Randomly generated per process, or read from MCP_AUTH_TOKEN env.
 */
export const AUTH_TOKEN =
  process.env.MCP_AUTH_TOKEN || crypto.randomBytes(24).toString("hex")

export const headerAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization
  if (header === `Bearer ${AUTH_TOKEN}`) {
    next()
    return
  }
  res.status(401).json({ error: "Unauthorized" })
}

export const headerOrQueryAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization
  if (header === `Bearer ${AUTH_TOKEN}`) {
    next()
    return
  }

  const token = req.query.token
  if (token === AUTH_TOKEN) {
    next()
    return
  }

  res.status(401).json({ error: "Unauthorized" })
}

/**
 * Validate a WHATTODO_API_TOKEN against the users table.
 * Falls back to the hardcoded relay token if Supabase is not configured.
 */
export async function validateToken(token: string): Promise<string | null> {
  if (isSupabaseConfigured) {
    return validateApiToken(token)
  }
  return token === AUTH_TOKEN ? "relay-user" : null
}
