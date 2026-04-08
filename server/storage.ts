import { getData, setData, validateApiToken, isSupabaseConfigured } from "./supabase.js"
import { isBrowserConnected, sendCommand } from "./relay.js"
import { executeToolOnData, defaultData, type ToolResult } from "./tools.js"

export type { ToolResult }

/**
 * Execute a tool operation directly against Supabase.
 * Requires WHATTODO_API_TOKEN to be validated first.
 */
export async function executeSupabase(
  apiToken: string,
  tool: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const userId = await validateApiToken(apiToken)
  if (!userId) return { content: [{ type: "text", text: "Error: Invalid API token" }], isError: true }

  const data = (await getData(userId)) ?? defaultData()
  const { result, mutated } = executeToolOnData(data, tool, params)
  if (mutated) await setData(userId, data)
  return result
}

/**
 * Execute a tool via the browser relay (localStorage users).
 */
export async function executeRelay(
  tool: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  if (!isBrowserConnected()) {
    return {
      content: [{ type: "text", text: "Error: No browser connected. Open the What Todo app in your browser first." }],
      isError: true,
    }
  }

  const response = await sendCommand(tool, params)
  if (!response.success) {
    return {
      content: [{ type: "text", text: `Error: ${response.error ?? "Unknown error"}` }],
      isError: true,
    }
  }
  return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] }
}

/**
 * Route to Supabase or relay based on available config and env.
 */
export async function executeTool(
  tool: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  const apiToken = process.env.WHATTODO_API_TOKEN

  if (isSupabaseConfigured && apiToken) {
    return executeSupabase(apiToken, tool, params)
  }

  return executeRelay(tool, params)
}
