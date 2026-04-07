// NOTE: The tool execution logic here is intentionally self-contained.
// Deno edge functions have strict module resolution requirements that make
// cross-runtime imports from the Node server (server/tools.ts) fragile.
// Keep the two in sync when adding or changing tools.

// ---- Types ------------------------------------------------------------------

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  pinned?: boolean
  labels?: string[]
  created_at: string
  completed_at?: string
  order?: number
}

export interface Label {
  id: string
  title: string
  color: string
}

export interface Data {
  schemaVersion?: number
  filters: string[]
  tasks: Record<string, Task[]>
  labels: Label[]
  sections?: Record<string, unknown>
  migrated?: boolean
}

interface McpRequest {
  method: string
  params?: {
    name?: string
    arguments?: Record<string, unknown>
  }
  id?: string | number
  jsonrpc?: string
}

export interface SupabaseClient {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>
      }
    }
    upsert: (
      row: unknown,
      opts?: unknown
    ) => Promise<{ error: { message: string } | null }>
  }
}

// ---- Constants --------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MAX_BODY_BYTES = 64 * 1024 // 64 KB

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
]

// ---- Helpers ----------------------------------------------------------------

function uuid(): string {
  return crypto.randomUUID()
}

function todayKey(): string {
  return new Date().toDateString()
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
      sidebar: { collapsed: false },
    },
  }
}

function findTask(data: Data, id?: string, title?: string): Task | undefined {
  const all = Object.values(data.tasks).flat()
  if (id) return all.find((t) => t.id === id)
  if (title) {
    const lower = title.toLowerCase()
    return all.find((t) => t.title.toLowerCase().includes(lower))
  }
}

function findLabel(data: Data, id?: string, title?: string): Label | undefined {
  if (id) return data.labels.find((l) => l.id === id)
  if (title) {
    const lower = title.toLowerCase()
    return data.labels.find((l) => l.title.toLowerCase().includes(lower))
  }
}

// ---- Auth -------------------------------------------------------------------

async function validateToken(
  db: SupabaseClient,
  token: string
): Promise<string | null> {
  const { data, error } = await db
    .from("users")
    .select("id")
    .eq("api_token", token)
    .maybeSingle()

  if (error || !data) return null
  return (data as { id: string }).id
}

// ---- Storage ----------------------------------------------------------------

async function getData(
  db: SupabaseClient,
  userId: string
): Promise<Data | null> {
  const { data, error } = await db
    .from("todos")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(`Failed to read todos: ${error.message}`)
  return ((data as { data: Data } | null)?.data) ?? null
}

async function setData(
  db: SupabaseClient,
  userId: string,
  newData: Data
): Promise<void> {
  const { error } = await db.from("todos").upsert(
    { user_id: userId, data: newData, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )

  if (error) throw new Error(`Failed to write todos: ${error.message}`)
}

// ---- Tool execution ---------------------------------------------------------

function ok(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
}

function toolErr(message: string) {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true }
}

async function executeTool(
  db: SupabaseClient,
  userId: string,
  tool: string,
  params: Record<string, unknown>
) {
  const data = (await getData(db, userId)) ?? defaultData()

  switch (tool) {
    case "list_todos": {
      const includeCompleted = params.include_completed as boolean | undefined
      const all = Object.values(data.tasks).flat()
      const tasks = includeCompleted ? all : all.filter((t) => !t.completed)
      return ok(
        tasks.map((t) => ({
          id: t.id, title: t.title, description: t.description,
          completed: t.completed, pinned: t.pinned, labels: t.labels,
          created_at: t.created_at,
        }))
      )
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
      await setData(db, userId, data)
      return ok({ message: `Added todo: ${task.title}` })
    }

    case "complete_todo": {
      const task = findTask(data, params.id as string, params.title as string)
      if (!task) return toolErr("Task not found")
      task.completed = true
      task.completed_at = new Date().toISOString()
      await setData(db, userId, data)
      return ok({ message: `Completed: ${task.title}` })
    }

    case "pin_todo": {
      const task = findTask(data, params.id as string, params.title as string)
      if (!task) return toolErr("Task not found")
      task.pinned = (params.pinned as boolean) ?? true
      await setData(db, userId, data)
      return ok({ message: `${task.pinned ? "Pinned" : "Unpinned"}: ${task.title}` })
    }

    case "create_label": {
      const existing = data.labels.find(
        (l) => l.title.toLowerCase() === (params.title as string).toLowerCase()
      )
      if (existing) return ok({ message: `Label already exists: ${existing.title}` })
      const label: Label = {
        id: uuid(),
        title: params.title as string,
        color:
          (params.color as string) ||
          COLORS[Math.floor(Math.random() * COLORS.length)],
      }
      data.labels.push(label)
      await setData(db, userId, data)
      return ok({ message: `Created label: ${label.title}` })
    }

    case "label_todo": {
      const task = findTask(
        data,
        params.task_id as string,
        params.task_title as string
      )
      if (!task) return toolErr("Task not found")
      const label = findLabel(
        data,
        params.label_id as string,
        params.label_title as string
      )
      if (!label) return toolErr("Label not found")
      task.labels = [...new Set([...(task.labels || []), label.id])]
      await setData(db, userId, data)
      return ok({ message: `Added label "${label.title}" to "${task.title}"` })
    }

    default:
      return toolErr(`Unknown tool: ${tool}`)
  }
}

// ---- MCP protocol -----------------------------------------------------------

const TOOLS = [
  {
    name: "list_todos",
    description: "List current todos. Returns all uncompleted tasks by default.",
    inputSchema: {
      type: "object",
      properties: {
        include_completed: { type: "boolean", description: "Include completed tasks. Defaults to false." },
      },
    },
  },
  {
    name: "list_labels",
    description: "List all available labels with their id, title, and color.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "add_todo",
    description: "Add a new todo task to today's list.",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", description: "The task title" },
        description: { type: "string", description: "Optional task description" },
        labels: { type: "array", items: { type: "string" } },
        pinned: { type: "boolean", description: "Whether to pin the task." },
      },
    },
  },
  {
    name: "complete_todo",
    description: "Mark a todo as completed.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
      },
    },
  },
  {
    name: "pin_todo",
    description: "Pin or unpin a todo.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        pinned: { type: "boolean" },
      },
    },
  },
  {
    name: "create_label",
    description: "Create a new label for categorizing todos.",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" },
        color: { type: "string" },
      },
    },
  },
  {
    name: "label_todo",
    description: "Add a label to a todo.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        task_title: { type: "string" },
        label_id: { type: "string" },
        label_title: { type: "string" },
      },
    },
  },
]

function mcpResponse(id: string | number | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result }
}

function mcpError(id: string | number | undefined, code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }
}

// ---- Main handler (exported for testing) -----------------------------------

export function createHandler(db: SupabaseClient) {
  return async (req: Request): Promise<Response> => {
    // 1. POST only
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 })
    }

    // 2. Body size limit — check header first (cheap), then actual body
    const contentLength = Number(req.headers.get("content-length") ?? 0)
    if (contentLength > MAX_BODY_BYTES) {
      return new Response("Payload Too Large", { status: 413 })
    }

    // 3. Auth header must be present — no DB query
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 })
    }

    const token = authHeader.slice(7).trim()
    if (!token) {
      return new Response("Unauthorized", { status: 401 })
    }

    // 4. UUID format check — reject garbage tokens without touching the DB
    if (!UUID_RE.test(token)) {
      return new Response("Unauthorized", { status: 401 })
    }

    // TODO: add Upstash rate limiting here (per-IP, before validateToken)

    // 5. Validate token against DB
    const userId = await validateToken(db, token)
    if (!userId) {
      return new Response(
        JSON.stringify(mcpError(null, -32600, "Invalid API token")),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // 6. Parse body — also enforce size limit on actual bytes
    let body: McpRequest
    try {
      const raw = await req.text()
      if (raw.length > MAX_BODY_BYTES) {
        return new Response("Payload Too Large", { status: 413 })
      }
      body = JSON.parse(raw)
    } catch {
      return new Response(
        JSON.stringify(mcpError(null, -32700, "Parse error")),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const { method, params, id } = body

    if (method === "initialize") {
      return Response.json(
        mcpResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "what-todo", version: "1.0.0" },
        })
      )
    }

    if (method === "tools/list") {
      return Response.json(mcpResponse(id, { tools: TOOLS }))
    }

    if (method === "tools/call") {
      const toolName = params?.name
      const toolArgs = (params?.arguments ?? {}) as Record<string, unknown>

      if (!toolName) {
        return Response.json(mcpError(id, -32602, "Missing tool name"), {
          status: 400,
        })
      }

      try {
        const result = await executeTool(db, userId, toolName, toolArgs)
        return Response.json(mcpResponse(id, result))
      } catch (e) {
        // Log detail server-side, return generic message to client
        console.error("[MCP] tool error:", e)
        return Response.json(mcpError(id, -32603, "Internal error"), {
          status: 500,
        })
      }
    }

    return Response.json(
      mcpError(id, -32601, `Method not found: ${method}`),
      { status: 404 }
    )
  }
}
