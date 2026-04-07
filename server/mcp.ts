import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { executeTool } from "./storage.js"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "what-todo",
    version: "1.0.0",
  })

  const tool = (
    name: string,
    description: string,
    schema: Record<string, z.ZodTypeAny>,
    handler: (params: Record<string, unknown>) => Record<string, unknown>
  ) => {
    server.tool(name, description, schema, async (params) =>
      executeTool(name, handler(params))
    )
  }

  tool(
    "list_todos",
    "List current todos. Returns all uncompleted tasks by default.",
    { include_completed: z.boolean().optional().describe("Include completed tasks. Defaults to false.") },
    (p) => p
  )

  tool(
    "list_labels",
    "List all available labels with their id, title, and color.",
    {},
    (p) => p
  )

  tool(
    "add_todo",
    "Add a new todo task to today's list.",
    {
      title: z.string().describe("The task title"),
      description: z.string().optional().describe("Optional task description"),
      labels: z.array(z.string()).optional().describe("Optional array of label IDs to attach"),
      pinned: z.boolean().optional().describe("Whether to pin the task. Defaults to false."),
    },
    (p) => p
  )

  tool(
    "complete_todo",
    "Mark a todo as completed. Provide either id or title to find the task.",
    {
      id: z.string().optional().describe("Task ID (exact match)"),
      title: z.string().optional().describe("Task title (case-insensitive substring match)"),
    },
    (p) => p
  )

  tool(
    "pin_todo",
    "Pin or unpin a todo. Provide either id or title to find the task.",
    {
      id: z.string().optional().describe("Task ID (exact match)"),
      title: z.string().optional().describe("Task title (case-insensitive substring match)"),
      pinned: z.boolean().optional().describe("Whether to pin (true) or unpin (false). Defaults to true."),
    },
    (p) => ({ ...p, pinned: (p.pinned as boolean) ?? true })
  )

  tool(
    "create_label",
    "Create a new label for categorizing todos.",
    {
      title: z.string().describe("Label title"),
      color: z.string().optional().describe("Hex color (e.g. '#ff0000'). Random color if omitted."),
    },
    (p) => p
  )

  tool(
    "label_todo",
    "Add a label to a todo. Both task and label can be matched by ID or title.",
    {
      task_id: z.string().optional().describe("Task ID (exact match)"),
      task_title: z.string().optional().describe("Task title (case-insensitive substring match)"),
      label_id: z.string().optional().describe("Label ID (exact match)"),
      label_title: z.string().optional().describe("Label title (case-insensitive substring match)"),
    },
    (p) => p
  )

  return server
}
