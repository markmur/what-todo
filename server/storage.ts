import { Data, Task, Label } from "../src/index.d"
import { getData, setData, validateApiToken, isSupabaseConfigured } from "./supabase.js"
import { isBrowserConnected, sendCommand } from "./relay.js"

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
]

function uuid() {
  return crypto.randomUUID()
}

function todayKey() {
  return new Date().toDateString()
}

function findTask(data: Data, id?: string, title?: string): Task | undefined {
  const all = Object.values(data.tasks).flat()
  if (id) return all.find(t => t.id === id)
  if (title) {
    const lower = title.toLowerCase()
    return all.find(t => t.title.toLowerCase().includes(lower))
  }
}

function findLabel(data: Data, id?: string, title?: string): Label | undefined {
  if (id) return data.labels.find(l => l.id === id)
  if (title) {
    const lower = title.toLowerCase()
    return data.labels.find(l => l.title.toLowerCase().includes(lower))
  }
}

function defaultData(): Data {
  return {
    schemaVersion: 1,
    migrated: true,
    filters: [],
    tasks: {},
    labels: [],
    sections: {
      completed: { collapsed: true },
      focus: {},
      sidebar: { collapsed: false }
    }
  }
}

export type ToolResult = {
  content: { type: "text"; text: string }[]
  isError?: boolean
}

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
}

function err(message: string): ToolResult {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true }
}

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
  if (!userId) return err("Invalid API token")

  const data = (await getData(userId)) ?? defaultData()

  switch (tool) {
    case "list_todos": {
      const includeCompleted = params.include_completed as boolean | undefined
      const all = Object.values(data.tasks).flat()
      const tasks = includeCompleted ? all : all.filter(t => !t.completed)
      return ok(tasks.map(t => ({
        id: t.id, title: t.title, description: t.description,
        completed: t.completed, pinned: t.pinned, labels: t.labels,
        created_at: t.created_at,
      })))
    }

    case "list_labels":
      return ok(data.labels)

    case "add_todo": {
      const key = todayKey()
      const task: Task = {
        id: uuid(),
        title: params.title as string,
        description: (params.description as string) || undefined,
        labels: (params.labels as string[]) || [],
        pinned: (params.pinned as boolean) || false,
        completed: false,
        created_at: new Date().toISOString(),
      }
      data.tasks[key] = [task, ...(data.tasks[key] || [])]
      await setData(userId, data)
      return ok({ message: `Added todo: ${task.title}` })
    }

    case "complete_todo": {
      const task = findTask(data, params.id as string, params.title as string)
      if (!task) return err("Task not found")
      task.completed = true
      task.completed_at = new Date().toISOString()
      await setData(userId, data)
      return ok({ message: `Completed: ${task.title}` })
    }

    case "pin_todo": {
      const task = findTask(data, params.id as string, params.title as string)
      if (!task) return err("Task not found")
      task.pinned = (params.pinned as boolean) ?? true
      await setData(userId, data)
      return ok({ message: `${task.pinned ? "Pinned" : "Unpinned"}: ${task.title}` })
    }

    case "create_label": {
      const existing = data.labels.find(
        l => l.title.toLowerCase() === (params.title as string).toLowerCase()
      )
      if (existing) return ok({ message: `Label already exists: ${existing.title}` })
      const label: Label = {
        id: uuid(),
        title: params.title as string,
        color: (params.color as string) || COLORS[Math.floor(Math.random() * COLORS.length)],
      }
      data.labels.push(label)
      await setData(userId, data)
      return ok({ message: `Created label: ${label.title}` })
    }

    case "label_todo": {
      const task = findTask(data, params.task_id as string, params.task_title as string)
      if (!task) return err("Task not found")
      const label = findLabel(data, params.label_id as string, params.label_title as string)
      if (!label) return err("Label not found")
      task.labels = [...new Set([...(task.labels || []), label.id])]
      await setData(userId, data)
      return ok({ message: `Added label "${label.title}" to "${task.title}"` })
    }

    default:
      return err(`Unknown tool: ${tool}`)
  }
}

/**
 * Execute a tool via the browser relay (localStorage users).
 */
export async function executeRelay(
  tool: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  if (!isBrowserConnected()) {
    return err("No browser connected. Open the What Todo app in your browser first.")
  }

  const response = await sendCommand(tool, params)
  if (!response.success) return err(response.error ?? "Unknown error")
  return ok(response.data)
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
