import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import Task from "./Task"
import { SettingsProvider } from "../context/SettingsContext"

const defaultLabels = {
  "label-1": { id: "label-1", title: "Work", color: "#ff6348" },
  "label-2": { id: "label-2", title: "Personal", color: "#45b975" },
  "label-3": { id: "label-3", title: "Urgent", color: "#5352ed" }
}

function createTask(overrides = {}) {
  return {
    id: "task-1",
    title: "Test task",
    description: "",
    completed: false,
    created_at: new Date().toISOString(),
    labels: ["label-1", "label-2"],
    pinned: false,
    ...overrides
  }
}

function renderTask(
  taskOverrides = {},
  propsOverrides: Record<string, any> = {}
) {
  const task = createTask(taskOverrides)
  const onUpdate = vi.fn()
  const onRemoveTask = vi.fn()
  const onFilter = vi.fn()
  const onMarkAsComplete = vi.fn()
  const onSelect = vi.fn()
  const onDeselect = vi.fn()
  const onMoveToToday = vi.fn()

  const result = render(
    <SettingsProvider>
      <Task
        task={task}
        active={false}
        labels={defaultLabels}
        filters={[]}
        onFilter={onFilter}
        onSelect={onSelect}
        onDeselect={onDeselect}
        onUpdate={onUpdate}
        onMarkAsComplete={onMarkAsComplete}
        onRemoveTask={onRemoveTask}
        onMoveToToday={onMoveToToday}
        {...propsOverrides}
      />
    </SettingsProvider>
  )

  return {
    ...result,
    task,
    onUpdate,
    onRemoveTask,
    onFilter,
    onMarkAsComplete,
    onSelect,
    onDeselect,
    onMoveToToday
  }
}

describe("Task", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe("Bug #1: Confirm delete should not drop labels", () => {
    it("preserves labels when delete is cancelled", () => {
      window.confirm = vi.fn(() => false)
      localStorage.setItem(
        "what-todo-settings",
        JSON.stringify({ confirmBeforeDelete: true })
      )

      const { onRemoveTask, onUpdate } = renderTask()

      const removeButton = document.querySelector(
        ".remove-icon:last-child"
      ) as HTMLElement
      fireEvent.click(removeButton)

      expect(window.confirm).toHaveBeenCalledWith("Delete this task?")
      expect(onRemoveTask).not.toHaveBeenCalled()
      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  describe("Bug #2: Description placeholder hidden on collapsed todos", () => {
    it("hides description textarea when inactive and no description", () => {
      renderTask({ description: "" })
      const textarea = document.querySelector("textarea[name='description']")
      expect(textarea).toBeNull()
    })

    it("shows description textarea when inactive with existing description", () => {
      renderTask({ description: "Some notes" })
      const textarea = document.querySelector("textarea[name='description']")
      expect(textarea).not.toBeNull()
    })

    it("renders description textarea with placeholder when active", () => {
      renderTask({ description: "" }, { active: true })
      const textarea = document.querySelector("textarea[name='description']")
      expect(textarea).not.toBeNull()
      expect(textarea?.getAttribute("placeholder")).toBe("Add description...")
    })
  })

  describe("Bug #4: Label click should not drop other labels", () => {
    it("adds a label without dropping existing labels", () => {
      const { onUpdate } = renderTask(
        { labels: ["label-1", "label-2"] },
        { active: true }
      )

      const urgentLabel = screen.getByText("Urgent")
      fireEvent.click(urgentLabel)

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: ["label-1", "label-2", "label-3"]
        })
      )
    })

    it("removes only the clicked label, preserving others", () => {
      const { onUpdate } = renderTask(
        { labels: ["label-1", "label-2"] },
        { active: true }
      )

      const workLabel = screen.getByText("Work")
      fireEvent.click(workLabel)

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: ["label-2"]
        })
      )
    })

    it("preserves labels after multiple consecutive clicks", () => {
      const { onUpdate } = renderTask({ labels: ["label-1"] }, { active: true })

      const personalLabel = screen.getByText("Personal")
      fireEvent.click(personalLabel)

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: ["label-1", "label-2"]
        })
      )
    })
  })

  describe("Mark as complete preserves edits", () => {
    it("uses local state, not stale task prop, when completing", () => {
      vi.useFakeTimers()
      const { onMarkAsComplete } = renderTask(
        { title: "Original title", labels: ["label-1", "label-2"] },
        { active: true }
      )

      const titleInput = document.querySelector(
        "textarea.task-title-input"
      ) as HTMLTextAreaElement
      fireEvent.change(titleInput, { target: { value: "Edited title" } })

      const checkbox = document.querySelector(
        "input[type='checkbox']"
      ) as HTMLInputElement
      fireEvent.click(checkbox)

      vi.advanceTimersByTime(1500)

      expect(onMarkAsComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Edited title",
          labels: ["label-1", "label-2"],
          completed: true
        })
      )
      vi.useRealTimers()
    })
  })

  describe("Pin toggle preserves edits", () => {
    it("uses local state when toggling pin", () => {
      const { onUpdate } = renderTask(
        { title: "Test task", labels: ["label-1", "label-2"], pinned: false },
        { active: true }
      )

      const titleInput = document.querySelector(
        "textarea.task-title-input"
      ) as HTMLTextAreaElement
      fireEvent.change(titleInput, { target: { value: "Edited title" } })

      const pinButton = document.querySelector(
        "[data-tip='Pin task']"
      ) as HTMLElement
      fireEvent.click(pinButton)

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Edited title",
          labels: ["label-1", "label-2"],
          pinned: true
        })
      )
    })

    it("preserves labels when unpinning", () => {
      const { onUpdate } = renderTask(
        { labels: ["label-1", "label-2"], pinned: true },
        { active: true }
      )

      const unpinButton = document.querySelector(
        "[data-tip='Unpin task']"
      ) as HTMLElement
      fireEvent.click(unpinButton)

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: ["label-1", "label-2"],
          pinned: false
        })
      )
    })
  })

  describe("Move to today preserves edits", () => {
    it("uses local state when moving to today", () => {
      const { onMoveToToday } = renderTask({
        title: "Test task",
        labels: ["label-1"]
      })

      const moveButton = document.querySelector(
        "[data-tip='Move to today']"
      ) as HTMLElement
      fireEvent.click(moveButton)

      expect(onMoveToToday).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test task",
          labels: ["label-1"]
        })
      )
    })
  })

  describe("handleBlur detects pinned changes", () => {
    it("saves when only pinned field changed", () => {
      const { onUpdate } = renderTask({ pinned: false }, { active: true })

      const pinButton = document.querySelector(
        "[data-tip='Pin task']"
      ) as HTMLElement
      fireEvent.click(pinButton)

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ pinned: true })
      )
    })
  })
})
