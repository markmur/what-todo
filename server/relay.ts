import crypto from "node:crypto"
import { Router } from "express"
import { z } from "zod"
import { headerAuth, headerOrQueryAuth } from "./auth.js"
import type { RelayCommand, RelayResponse } from "./types.js"
import type { Response } from "express"

const RelayResponseSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
})

const router = Router()

let browserResponse: Response | null = null

const pendingCommands = new Map<
  string,
  { resolve: (response: RelayResponse) => void; timeout: NodeJS.Timeout }
>()

export function isBrowserConnected(): boolean {
  return browserResponse !== null
}

export function sendCommand(
  tool: string,
  params: Record<string, unknown>,
): Promise<RelayResponse> {
  if (!browserResponse) {
    return Promise.resolve({
      id: "",
      success: false,
      error:
        "No browser connected. Please open the What Todo app in your browser first.",
    })
  }

  const command: RelayCommand = {
    id: crypto.randomUUID(),
    tool,
    params,
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pendingCommands.delete(command.id)
      resolve({ id: command.id, success: false, error: "Command timed out" })
    }, 10_000)

    pendingCommands.set(command.id, { resolve, timeout })

    browserResponse!.write(`data: ${JSON.stringify(command)}\n\n`)
  })
}

router.get("/relay/events", headerOrQueryAuth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()

  if (browserResponse) {
    browserResponse.end()
  }

  browserResponse = res

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n")
  }, 30_000)

  req.on("close", () => {
    clearInterval(heartbeat)
    if (browserResponse === res) {
      browserResponse = null
    }
  })
})

router.post("/relay/respond", headerAuth, (req, res) => {
  const result = RelayResponseSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: "Invalid response body" })
    return
  }

  const response: RelayResponse = result.data

  const pending = pendingCommands.get(response.id)
  if (pending) {
    clearTimeout(pending.timeout)
    pending.resolve(response)
    pendingCommands.delete(response.id)
  }

  res.json({ ok: true })
})

export default router
