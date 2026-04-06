import crypto from "node:crypto"
import type { RequestHandler } from "express"

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
