import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { isBrowserConnected, sendCommand } from "./relay.js"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "what-todo",
    version: "1.0.0",
  })

  function relayTool(tool: string, params: Record<string, unknown>) {
    if (!isBrowserConnected()) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: No browser connected. Please open the What Todo app in your browser first.",
          },
        ],
        isError: true,
      }
    }

    return sendCommand(tool, params).then((response) => {
      if (!response.success) {
        return {
          content: [
            { type: "text" as const, text: `Error: ${response.error}` },
          ],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      }
    })
  }

  server.tool(
    "list_todos",
    "List current todos. Returns all uncompleted tasks by default.",
    { include_completed: z.boolean().optional().describe("Include completed tasks. Defaults to false.") },
    async ({ include_completed }) => relayTool("list_todos", { include_completed }),
  )

  server.tool(
    "list_labels",
    "List all available labels with their id, title, and color.",
    {},
    async () => relayTool("list_labels", {}),
  )

  server.tool(
    "add_todo",
    "Add a new todo task to today's list.",
    {
      title: z.string().describe("The task title"),
      description: z.string().optional().describe("Optional task description"),
      labels: z.array(z.string()).optional().describe("Optional array of label IDs to attach"),
      pinned: z.boolean().optional().describe("Whether to pin the task. Defaults to false."),
    },
    async (params) => relayTool("add_todo", params),
  )

  server.tool(
    "complete_todo",
    "Mark a todo as completed. Provide either id or title to find the task.",
    {
      id: z.string().optional().describe("Task ID (exact match)"),
      title: z.string().optional().describe("Task title (case-insensitive substring match)"),
    },
    async (params) => relayTool("complete_todo", params),
  )

  server.tool(
    "pin_todo",
    "Pin or unpin a todo. Provide either id or title to find the task.",
    {
      id: z.string().optional().describe("Task ID (exact match)"),
      title: z.string().optional().describe("Task title (case-insensitive substring match)"),
      pinned: z.boolean().optional().describe("Whether to pin (true) or unpin (false). Defaults to true."),
    },
    async (params) => relayTool("pin_todo", { ...params, pinned: params.pinned ?? true }),
  )

  server.tool(
    "create_label",
    "Create a new label for categorizing todos.",
    {
      title: z.string().describe("Label title"),
      color: z.string().optional().describe("Hex color (e.g. '#ff0000'). Random color if omitted."),
    },
    async (params) => relayTool("create_label", params),
  )

  server.tool(
    "label_todo",
    "Add a label to a todo. Both task and label can be matched by ID or title.",
    {
      task_id: z.string().optional().describe("Task ID (exact match)"),
      task_title: z.string().optional().describe("Task title (case-insensitive substring match)"),
      label_id: z.string().optional().describe("Label ID (exact match)"),
      label_title: z.string().optional().describe("Label title (case-insensitive substring match)"),
    },
    async (params) => relayTool("label_todo", params),
  )

  return server
}
