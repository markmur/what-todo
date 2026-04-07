import { Data, Task, Label } from "../src/index.d"

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
]

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

export function defaultData(): Data {
  return {
    schemaVersion: 1,
    migrated: true,
    filters: [],
    tasks: {},
    labels: [],
    sections: {
      completed: { collapsed: true },
      focus: {},
      sidebar: { collapsed: false },
    },
  }
}

/**
 * Apply a tool operation to an in-memory Data object.
 * Returns the result and a boolean indicating whether the data was mutated
 * (so callers can decide whether to persist).
 */
export function executeToolOnData(
  data: Data,
  tool: string,
  params: Record<string, unknown>
): { result: ToolResult; mutated: boolean } {
  const r = (result: ToolResult, mutated = false) => ({ result, mutated })

  switch (tool) {
    case "list_todos": {
      const includeCompleted = params.include_completed as boolean | undefined
      const all = Object.values(data.tasks).flat()
      const tasks = includeCompleted ? all : all.filter(t => !t.completed)
      return r(ok(tasks.map(t => ({
        id: t.id, title: t.title, description: t.description,
        completed: t.completed, pinned: t.pinned, labels: t.labels,
        created_at: t.created_at,
      }))))
    }

    case "list_labels":
      return r(ok(data.labels))

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
      return r(ok({ message: `Added todo: ${task.title}` }), true)
    }

    case "complete_todo": {
      const task = findTask(data, params.id as string, params.title as string)
      if (!task) return r(err("Task not found"))
      task.completed = true
      task.completed_at = new Date().toISOString()
      return r(ok({ message: `Completed: ${task.title}` }), true)
    }

    case "pin_todo": {
      const task = findTask(data, params.id as string, params.title as string)
      if (!task) return r(err("Task not found"))
      task.pinned = (params.pinned as boolean) ?? true
      return r(ok({ message: `${task.pinned ? "Pinned" : "Unpinned"}: ${task.title}` }), true)
    }

    case "create_label": {
      const existing = data.labels.find(
        l => l.title.toLowerCase() === (params.title as string).toLowerCase()
      )
      if (existing) return r(ok({ message: `Label already exists: ${existing.title}` }))
      const label: Label = {
        id: uuid(),
        title: params.title as string,
        color: (params.color as string) || COLORS[Math.floor(Math.random() * COLORS.length)],
      }
      data.labels.push(label)
      return r(ok({ message: `Created label: ${label.title}` }), true)
    }

    case "label_todo": {
      const task = findTask(data, params.task_id as string, params.task_title as string)
      if (!task) return r(err("Task not found"))
      const label = findLabel(data, params.label_id as string, params.label_title as string)
      if (!label) return r(err("Label not found"))
      task.labels = [...new Set([...(task.labels || []), label.id])]
      return r(ok({ message: `Added label "${label.title}" to "${task.title}"` }), true)
    }

    default:
      return r(err(`Unknown tool: ${tool}`))
  }
}
