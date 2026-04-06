import express from "express"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createMcpServer } from "./mcp.js"
import relayRouter from "./relay.js"
import { AUTH_TOKEN } from "./auth.js"

const relayPort = parseInt(process.env.MCP_RELAY_PORT || "3001", 10)

const relayApp = express()
relayApp.use(express.json())
relayApp.use(relayRouter)

relayApp.listen(relayPort, () => {
  console.error(`[MCP Relay] Listening on http://localhost:${relayPort}`)
  console.error(`[MCP Relay] Auth token: ${AUTH_TOKEN}`)
})

const mcpServer = createMcpServer()
const transport = new StdioServerTransport()
await mcpServer.connect(transport)
