import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import List from "./List"
import { SettingsProvider } from "../context/SettingsContext"

const defaultLabels = {
  "label-1": { id: "label-1", title: "Work", color: "#5352ed" }
}

function makeTasks(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `Task ${i}`,
    completed: false,
    created_at: new Date(Date.now() + i * 1000).toISOString(),
    labels: [],
    pinned: false
  }))
}

const noop = vi.fn()

function renderList(tasks = makeTasks(3), props = {}) {
  const onReorder = vi.fn()
  const result = render(
    <SettingsProvider>
      <List
        tasks={tasks}
        labels={defaultLabels}
        filters={[]}
        onFilter={noop}
        onUpdateTask={noop}
        onRemoveTask={noop}
        onMarkAsComplete={noop}
        onReorder={onReorder}
        {...props}
      />
    </SettingsProvider>
  )
  return { ...result, onReorder }
}

describe("List", () => {
  describe("reorder stability", () => {
    it("renders without infinite loop", () => {
      const { container } = renderList()
      expect(container.querySelectorAll(".task").length).toBe(3)
    })

    it("re-renders stably when tasks change order but not IDs", () => {
      const tasks = makeTasks(3)
      const { rerender, container } = render(
        <SettingsProvider>
          <List
            tasks={tasks}
            labels={defaultLabels}
            filters={[]}
            onFilter={noop}
            onUpdateTask={noop}
            onRemoveTask={noop}
            onMarkAsComplete={noop}
            onReorder={noop}
          />
        </SettingsProvider>
      )

      // Rerender with same tasks in different order
      const reversed = [...tasks].reverse()
      rerender(
        <SettingsProvider>
          <List
            tasks={reversed}
            labels={defaultLabels}
            filters={[]}
            onFilter={noop}
            onUpdateTask={noop}
            onRemoveTask={noop}
            onMarkAsComplete={noop}
            onReorder={noop}
          />
        </SettingsProvider>
      )

      // Should still render 3 tasks without crashing
      expect(container.querySelectorAll(".task").length).toBe(3)
    })
  })

  describe("empty state", () => {
    it("shows enjoy message when no tasks and onReorder is provided", () => {
      renderList([])
      expect(screen.getByText("Nothing to do — enjoy your day!")).toBeTruthy()
    })

    it("shows filter message when filtering with no results", () => {
      renderList([], { isFiltering: true })
      expect(screen.getByText("No tasks found.")).toBeTruthy()
    })
  })

  describe("drag handle", () => {
    it("renders drag handles for reorderable tasks", () => {
      const { container } = renderList()
      const handles = container.querySelectorAll("[data-testid='drag-handle']")
      expect(handles.length).toBe(3)
    })
  })
})
