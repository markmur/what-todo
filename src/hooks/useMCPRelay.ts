import type { Data, Task, Label } from "../index.d"
import { STORAGE_KEY } from "../adapters/LocalStorageAdapter"

function notifyStorageUpdate() {
  // Dispatch a storage event so StorageContext re-reads from localStorage
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }))
}

interface RelayCommand {
  id: string
  tool: string
  params: Record<string, unknown>
}

const RELAY_TOKEN = import.meta.env.VITE_MCP_RELAY_TOKEN as string

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899"
]

const defaultData: Data = {
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

function read(): Data {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultData
  try {
    return JSON.parse(raw) as Data
  } catch {
    return defaultData
  }
}

declare global {
  interface Window {
    __mcpRelayEventSource?: EventSource
  }
}

function write(data: Data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  notifyStorageUpdate()
}

function uuid() {
  return crypto.randomUUID()
}

function todayKey() {
  return new Date().toDateString()
}

function findTask(data: Data, id?: string, title?: string): Task | undefined {
  const allTasks = Object.values(data.tasks).flat()
  if (id) return allTasks.find(t => t.id === id)
  if (title) {
    const lower = title.toLowerCase()
    return allTasks.find(t => t.title.toLowerCase().includes(lower))
  }
  return undefined
}

function findLabel(data: Data, id?: string, title?: string): Label | undefined {
  if (id) return data.labels.find(l => l.id === id)
  if (title) {
    const lower = title.toLowerCase()
    return data.labels.find(l => l.title.toLowerCase().includes(lower))
  }
  return undefined
}

function executeCommand(command: RelayCommand): {
  success: boolean
  data?: unknown
  error?: string
} {
  const { tool, params } = command
  const data = read()

  switch (tool) {
    case "list_todos": {
      const includeCompleted = params.include_completed as boolean | undefined
      const allTasks = Object.values(data.tasks).flat()
      const tasks = includeCompleted
        ? allTasks
        : allTasks.filter(t => !t.completed)
      return {
        success: true,
        data: tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          completed: t.completed,
          pinned: t.pinned,
          labels: t.labels,
          created_at: t.created_at
        }))
      }
    }

    case "list_labels": {
      return { success: true, data: data.labels }
    }

    case "add_todo": {
      const key = todayKey()
      const task: Task = {
        id: uuid(),
        title: params.title as string,
        description: (params.description as string) || undefined,
        labels: (params.labels as string[]) || [],
        pinned: (params.pinned as boolean) || false,
        completed: false,
        created_at: new Date().toISOString()
      }
      data.tasks[key] = [task, ...(data.tasks[key] || [])]
      write(data)
      return { success: true, data: { message: `Added todo: ${task.title}` } }
    }

    case "complete_todo": {
      const task = findTask(data, params.id as string, params.title as string)
      if (!task) return { success: false, error: "Task not found" }
      task.completed = true
      task.completed_at = new Date().toISOString()
      write(data)
      return { success: true, data: { message: `Completed: ${task.title}` } }
    }

    case "pin_todo": {
      const task = findTask(data, params.id as string, params.title as string)
      if (!task) return { success: false, error: "Task not found" }
      task.pinned = (params.pinned as boolean) ?? true
      write(data)
      return {
        success: true,
        data: {
          message: `${task.pinned ? "Pinned" : "Unpinned"}: ${task.title}`
        }
      }
    }

    case "create_label": {
      const existing = data.labels.find(
        l => l.title.toLowerCase() === (params.title as string).toLowerCase()
      )
      if (existing) {
        return {
          success: true,
          data: { message: `Label already exists: ${existing.title}` }
        }
      }
      const color =
        (params.color as string) ||
        COLORS[Math.floor(Math.random() * COLORS.length)]
      const label: Label = {
        id: uuid(),
        title: params.title as string,
        color
      }
      data.labels.push(label)
      write(data)
      return {
        success: true,
        data: { message: `Created label: ${label.title}` }
      }
    }

    case "label_todo": {
      const task = findTask(
        data,
        params.task_id as string,
        params.task_title as string
      )
      if (!task) return { success: false, error: "Task not found" }
      const label = findLabel(
        data,
        params.label_id as string,
        params.label_title as string
      )
      if (!label) return { success: false, error: "Label not found" }
      task.labels = [...new Set([...(task.labels || []), label.id])]
      write(data)
      return {
        success: true,
        data: {
          message: `Added label "${label.title}" to "${task.title}"`
        }
      }
    }

    default:
      return { success: false, error: `Unknown tool: ${tool}` }
  }
}

declare global {
  interface Window {
    __mcpRelayEventSource?: EventSource
  }
}

if (RELAY_TOKEN && !window.__mcpRelayEventSource) {
  const url = `/relay/events?token=${RELAY_TOKEN}`
  const eventSource = new EventSource(url)
  window.__mcpRelayEventSource = eventSource

  let queue: Promise<void> = Promise.resolve()

  eventSource.onmessage = event => {
    const command: RelayCommand = JSON.parse(event.data)

    queue = queue.then(async () => {
      let result: { success: boolean; data?: unknown; error?: string }

      try {
        result = executeCommand(command)
      } catch (err) {
        result = {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        }
      }

      await fetch("/relay/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RELAY_TOKEN}`
        },
        body: JSON.stringify({ id: command.id, ...result })
      })
    })
  }

  eventSource.onerror = () => {
    console.warn("[MCP Relay] SSE connection error, will retry...")
  }
}

export function useMCPRelay() {}
