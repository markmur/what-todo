import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, act, waitFor } from "@testing-library/react"
import StorageProvider, { useStorage } from "./StorageContext"
import { AuthProvider } from "./AuthContext"
import { Data } from "../index.d"

// Mock Supabase — no configured client means auth is always anonymous
vi.mock("../lib/supabase", () => ({ supabase: null }))

const sampleData: Data = {
  schemaVersion: 1,
  filters: [],
  tasks: {
    "Wed Jan 01 2025": [
      {
        id: "t1",
        title: "Test task",
        completed: false,
        created_at: new Date("2025-01-01").toISOString(),
        labels: []
      }
    ]
  },
  labels: [{ id: "l1", title: "Work", color: "#3b82f6" }],
  sections: {
    completed: { collapsed: true },
    focus: {},
    sidebar: { collapsed: false }
  }
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StorageProvider>{children}</StorageProvider>
    </AuthProvider>
  )
}

function StorageConsumer() {
  const {
    data,
    addTask,
    addLabel,
    removeLabel,
    isSupabaseConnected,
    dataConflict
  } = useStorage()

  const allTasks = Object.values(data.tasks).flat()

  return (
    <div>
      <span data-testid="task-count">{allTasks.length}</span>
      <span data-testid="label-count">{data.labels.length}</span>
      <span data-testid="supabase-connected">
        {String(isSupabaseConnected)}
      </span>
      <span data-testid="has-conflict">{String(!!dataConflict)}</span>
      <button
        onClick={() =>
          addTask({
            id: "",
            title: "New task",
            completed: false,
            created_at: new Date().toISOString(),
            labels: []
          })
        }
      >
        add task
      </button>
      <button
        onClick={() =>
          addLabel({ id: "", title: "Personal", color: "#ef4444" })
        }
      >
        add label
      </button>
      {data.labels.map(l => (
        <button key={l.id} onClick={() => removeLabel(l)}>
          remove {l.title}
        </button>
      ))}
    </div>
  )
}

describe("StorageContext", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("provides empty default data with no localStorage", async () => {
    render(
      <Wrapper>
        <StorageConsumer />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByTestId("task-count").textContent).toBe("0")
    })
  })

  it("loads existing localStorage data on mount", async () => {
    localStorage.setItem("what-todo", JSON.stringify(sampleData))
    render(
      <Wrapper>
        <StorageConsumer />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByTestId("task-count").textContent).toBe("1")
      expect(screen.getByTestId("label-count").textContent).toBe("1")
    })
  })

  it("adds a task and reflects it in the UI", async () => {
    render(
      <Wrapper>
        <StorageConsumer />
      </Wrapper>
    )
    await waitFor(() =>
      expect(screen.getByTestId("task-count").textContent).toBe("0")
    )
    act(() => {
      screen.getByText("add task").click()
    })
    await waitFor(() => {
      expect(screen.getByTestId("task-count").textContent).toBe("1")
    })
  })

  it("adds a label and reflects it in the UI", async () => {
    render(
      <Wrapper>
        <StorageConsumer />
      </Wrapper>
    )
    await waitFor(
      () => expect(screen.getByTestId("label-count").textContent).toBe("2") // default labels
    )
    act(() => {
      screen.getByText("add label").click()
    })
    await waitFor(() => {
      expect(screen.getByTestId("label-count").textContent).toBe("3")
    })
  })

  it("removes a label", async () => {
    localStorage.setItem("what-todo", JSON.stringify(sampleData))
    render(
      <Wrapper>
        <StorageConsumer />
      </Wrapper>
    )
    await waitFor(() =>
      expect(screen.getByTestId("label-count").textContent).toBe("1")
    )
    act(() => {
      screen.getByText("remove Work").click()
    })
    await waitFor(() => {
      expect(screen.getByTestId("label-count").textContent).toBe("0")
    })
  })

  it("is not supabase connected by default", async () => {
    render(
      <Wrapper>
        <StorageConsumer />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByTestId("supabase-connected").textContent).toBe("false")
    })
  })

  it("has no data conflict by default", async () => {
    render(
      <Wrapper>
        <StorageConsumer />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByTestId("has-conflict").textContent).toBe("false")
    })
  })

  it("persists added task to localStorage", async () => {
    render(
      <Wrapper>
        <StorageConsumer />
      </Wrapper>
    )
    await waitFor(() =>
      expect(screen.getByTestId("task-count").textContent).toBe("0")
    )
    act(() => {
      screen.getByText("add task").click()
    })
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("what-todo") ?? "{}")
      const tasks = Object.values(stored.tasks ?? {}).flat()
      expect(tasks).toHaveLength(1)
    })
  })
})
