import { describe, it, expect, beforeEach } from "vitest"
import { createHandler, type Data, type SupabaseClient } from "./handler"

// ---- Mock DB ----------------------------------------------------------------

const VALID_TOKEN = "550e8400-e29b-41d4-a716-446655440000"
const VALID_USER_ID = "user-123"

const emptyData: Data = {
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

function makeMockDb(
  overrides: {
    tokenValid?: boolean
    data?: Data | null
    setError?: string | null
  } = {}
): { db: SupabaseClient; writes: Data[] } {
  const { tokenValid = true, data = emptyData, setError = null } = overrides
  const writes: Data[] = []

  const db: SupabaseClient = {
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, val: string) => ({
          maybeSingle: async () => {
            if (table === "users") {
              if (val === VALID_TOKEN && tokenValid) {
                return { data: { id: VALID_USER_ID }, error: null }
              }
              return { data: null, error: null }
            }
            if (table === "todos") {
              return { data: data ? { data } : null, error: null }
            }
            return { data: null, error: null }
          },
        }),
      }),
      upsert: async (row: unknown) => {
        if (setError) return { error: { message: setError } }
        writes.push((row as { data: Data }).data)
        return { error: null }
      },
    }),
  }

  return { db, writes }
}

function post(body: unknown, options: {
  token?: string | null
  contentLength?: number
} = {}): Request {
  const { token = VALID_TOKEN, contentLength } = options
  const bodyStr = JSON.stringify(body)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Content-Length": String(contentLength ?? bodyStr.length),
  }
  if (token !== null) headers["Authorization"] = `Bearer ${token}`
  return new Request("http://localhost/mcp", { method: "POST", headers, body: bodyStr })
}

// ---- Security checks --------------------------------------------------------

describe("security", () => {
  it("rejects non-POST requests", async () => {
    const { db } = makeMockDb()
    const res = await createHandler(db)(
      new Request("http://localhost/mcp", { method: "GET" })
    )
    expect(res.status).toBe(405)
  })

  it("rejects missing Authorization header", async () => {
    const { db } = makeMockDb()
    const res = await createHandler(db)(post({ method: "initialize" }, { token: null }))
    expect(res.status).toBe(401)
  })

  it("rejects non-UUID token without touching the DB", async () => {
    const { db } = makeMockDb()
    const res = await createHandler(db)(
      post({ method: "initialize" }, { token: "not-a-uuid" })
    )
    expect(res.status).toBe(401)
  })

  it("rejects token that is Bearer with empty value", async () => {
    const { db } = makeMockDb()
    const req = new Request("http://localhost/mcp", {
      method: "POST",
      headers: { Authorization: "Bearer ", "Content-Type": "application/json" },
      body: JSON.stringify({ method: "initialize" }),
    })
    const res = await createHandler(db)(req)
    expect(res.status).toBe(401)
  })

  it("rejects oversized body", async () => {
    const { db } = makeMockDb()
    // Content-Length is a forbidden header in the Fetch API so we send a real large body
    const largeBody = JSON.stringify({ method: "initialize", padding: "x".repeat(65 * 1024) })
    const req = new Request("http://localhost/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${VALID_TOKEN}` },
      body: largeBody,
    })
    const res = await createHandler(db)(req)
    expect(res.status).toBe(413)
  })

  it("rejects valid-format token not in DB", async () => {
    const { db } = makeMockDb({ tokenValid: false })
    const res = await createHandler(db)(post({ method: "initialize" }))
    expect(res.status).toBe(401)
  })

  it("does not leak internal error details to client", async () => {
    const { db } = makeMockDb({ setError: "pg: connection reset by peer" })
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "add_todo", arguments: { title: "x" } } })
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.message).toBe("Internal error")
    expect(body.error.message).not.toContain("pg:")
  })
})

// ---- MCP protocol -----------------------------------------------------------

describe("MCP protocol", () => {
  it("handles initialize", async () => {
    const { db } = makeMockDb()
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "initialize" })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.serverInfo.name).toBe("what-todo")
    expect(body.result.protocolVersion).toBe("2024-11-05")
  })

  it("handles tools/list", async () => {
    const { db } = makeMockDb()
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/list" })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.tools).toHaveLength(7)
    expect(body.result.tools.map((t: { name: string }) => t.name)).toContain("add_todo")
  })

  it("returns 404 for unknown method", async () => {
    const { db } = makeMockDb()
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "unknown/method" })
    )
    expect(res.status).toBe(404)
  })

  it("returns 400 for malformed JSON body", async () => {
    const { db } = makeMockDb()
    const req = new Request("http://localhost/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${VALID_TOKEN}`,
        "Content-Length": "5",
      },
      body: "{{bad",
    })
    const res = await createHandler(db)(req)
    expect(res.status).toBe(400)
  })
})

// ---- Tools ------------------------------------------------------------------

describe("tools/call", () => {
  let db: SupabaseClient
  let writes: Data[]

  beforeEach(() => {
    ;({ db, writes } = makeMockDb({ data: null }))
  })

  it("list_todos returns empty array when no data exists", async () => {
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_todos", arguments: {} } })
    )
    const body = await res.json()
    expect(JSON.parse(body.result.content[0].text)).toEqual([])
  })

  it("list_todos filters completed tasks by default", async () => {
    const data: Data = {
      ...emptyData,
      tasks: {
        "Wed Jan 01 2025": [
          { id: "t1", title: "Active", completed: false, created_at: new Date().toISOString(), labels: [] },
          { id: "t2", title: "Done", completed: true, created_at: new Date().toISOString(), labels: [] },
        ],
      },
    }
    ;({ db, writes } = makeMockDb({ data }))
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_todos", arguments: {} } })
    )
    const body = await res.json()
    const tasks = JSON.parse(body.result.content[0].text)
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe("Active")
  })

  it("list_todos includes completed when flag is set", async () => {
    const data: Data = {
      ...emptyData,
      tasks: {
        "Wed Jan 01 2025": [
          { id: "t1", title: "Active", completed: false, created_at: new Date().toISOString(), labels: [] },
          { id: "t2", title: "Done", completed: true, created_at: new Date().toISOString(), labels: [] },
        ],
      },
    }
    ;({ db, writes } = makeMockDb({ data }))
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_todos", arguments: { include_completed: true } } })
    )
    const body = await res.json()
    const tasks = JSON.parse(body.result.content[0].text)
    expect(tasks).toHaveLength(2)
  })

  it("add_todo creates a task and writes to DB", async () => {
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "add_todo", arguments: { title: "Buy milk" } } })
    )
    expect(res.status).toBe(200)
    expect(writes).toHaveLength(1)
    const tasks = Object.values(writes[0].tasks).flat()
    expect(tasks[0].title).toBe("Buy milk")
    expect(tasks[0].completed).toBe(false)
  })

  it("add_todo preserves pinned and description", async () => {
    await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "add_todo", arguments: { title: "Test", description: "Details", pinned: true } } })
    )
    const task = Object.values(writes[0].tasks).flat()[0]
    expect(task.description).toBe("Details")
    expect(task.pinned).toBe(true)
  })

  it("complete_todo marks task completed by title", async () => {
    const data: Data = {
      ...emptyData,
      tasks: {
        "Wed Jan 01 2025": [
          { id: "t1", title: "Buy milk", completed: false, created_at: new Date().toISOString(), labels: [] },
        ],
      },
    }
    ;({ db, writes } = makeMockDb({ data }))
    await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "complete_todo", arguments: { title: "milk" } } })
    )
    const task = Object.values(writes[0].tasks).flat()[0]
    expect(task.completed).toBe(true)
    expect(task.completed_at).toBeDefined()
  })

  it("complete_todo returns error when task not found", async () => {
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "complete_todo", arguments: { title: "nonexistent" } } })
    )
    const body = await res.json()
    expect(body.result.isError).toBe(true)
  })

  it("pin_todo pins a task by id", async () => {
    const data: Data = {
      ...emptyData,
      tasks: {
        "Wed Jan 01 2025": [
          { id: "t1", title: "Task", completed: false, pinned: false, created_at: new Date().toISOString(), labels: [] },
        ],
      },
    }
    ;({ db, writes } = makeMockDb({ data }))
    await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "pin_todo", arguments: { id: "t1" } } })
    )
    const task = Object.values(writes[0].tasks).flat()[0]
    expect(task.pinned).toBe(true)
  })

  it("create_label adds a label", async () => {
    await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "create_label", arguments: { title: "Work", color: "#3b82f6" } } })
    )
    expect(writes[0].labels[0].title).toBe("Work")
    expect(writes[0].labels[0].color).toBe("#3b82f6")
  })

  it("create_label is idempotent for existing title", async () => {
    const data: Data = { ...emptyData, labels: [{ id: "l1", title: "Work", color: "#000" }] }
    ;({ db, writes } = makeMockDb({ data }))
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "create_label", arguments: { title: "work" } } })
    )
    expect(res.status).toBe(200)
    expect(writes).toHaveLength(0)
  })

  it("label_todo attaches a label to a task by title", async () => {
    const data: Data = {
      ...emptyData,
      tasks: {
        "Wed Jan 01 2025": [
          { id: "t1", title: "Buy milk", completed: false, created_at: new Date().toISOString(), labels: [] },
        ],
      },
      labels: [{ id: "l1", title: "Work", color: "#000" }],
    }
    ;({ db, writes } = makeMockDb({ data }))
    await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "label_todo", arguments: { task_title: "milk", label_title: "work" } } })
    )
    const task = Object.values(writes[0].tasks).flat()[0]
    expect(task.labels).toContain("l1")
  })

  it("returns error for unknown tool", async () => {
    const res = await createHandler(db)(
      post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "delete_everything", arguments: {} } })
    )
    const body = await res.json()
    expect(body.result.isError).toBe(true)
  })
})
