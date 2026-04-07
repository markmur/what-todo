import express from "express"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createMcpServer } from "./mcp.js"
import relayRouter from "./relay.js"
import { isSupabaseConfigured } from "./supabase.js"

const mode = isSupabaseConfigured && process.env.WHATTODO_API_TOKEN
  ? "supabase"
  : "relay"

if (mode === "relay") {
  const relayPort = parseInt(process.env.MCP_RELAY_PORT || "3001", 10)
  const relayApp = express()
  relayApp.use(express.json())
  relayApp.use(relayRouter)
  relayApp.listen(relayPort, () => {
    console.error(`[MCP] Mode: relay — open the What Todo app in your browser`)
    console.error(`[MCP Relay] Listening on http://localhost:${relayPort}`)
  })
} else {
  console.error(`[MCP] Mode: supabase — reading/writing directly to the database`)
}

const mcpServer = createMcpServer()
const transport = new StdioServerTransport()
await mcpServer.connect(transport)
