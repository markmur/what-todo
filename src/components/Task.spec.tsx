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

  describe("Delete calls onRemoveTask", () => {
    it("calls onRemoveTask when delete icon is clicked", () => {
      const { onRemoveTask } = renderTask()

      const removeButton = document.querySelector(
        "[aria-label='Delete task']"
      ) as HTMLElement
      fireEvent.pointerUp(removeButton)

      expect(onRemoveTask).toHaveBeenCalled()
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

    it("hides inline label indicators when task is active", () => {
      renderTask({ labels: ["label-1", "label-2"] }, { active: true })

      const inlineLabels = document.querySelectorAll(
        "[aria-label='Task actions'] [role='button'][aria-label]"
      )
      expect(inlineLabels.length).toBe(0)
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
        "textarea[aria-label='Task title']"
      ) as HTMLTextAreaElement
      fireEvent.change(titleInput, { target: { value: "Edited title" } })

      const checkbox = document.querySelector(
        "[role='checkbox']"
      ) as HTMLElement
      fireEvent.pointerUp(checkbox)

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
        "textarea[aria-label='Task title']"
      ) as HTMLTextAreaElement
      fireEvent.change(titleInput, { target: { value: "Edited title" } })

      const pinButton = document.querySelector(
        "[aria-label='Pin task']"
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
        "[aria-label='Unpin task']"
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
        "[aria-label='Move to today']"
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
        "[aria-label='Pin task']"
      ) as HTMLElement
      fireEvent.click(pinButton)

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ pinned: true })
      )
    })
  })

  describe("Keyboard shortcuts", () => {
    it("Escape calls onDeselect", () => {
      const { onDeselect } = renderTask({}, { active: true })
      const card = document.querySelector("[role='article']") as HTMLElement
      fireEvent.keyDown(card, { key: "Escape" })
      expect(onDeselect).toHaveBeenCalled()
    })

    it("Cmd+Enter calls onDeselect", () => {
      const { onDeselect } = renderTask({}, { active: true })
      const textarea = document.querySelector(
        "textarea[aria-label='Task title']"
      ) as HTMLElement
      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true })
      expect(onDeselect).toHaveBeenCalled()
    })

    it("P key toggles pin when not typing", () => {
      const { onUpdate } = renderTask({ pinned: false }, { active: true })
      const card = document.querySelector("[role='article']") as HTMLElement
      fireEvent.keyDown(card, { key: "p" })
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ pinned: true })
      )
    })

    it("X key calls onRemoveTask when not typing", () => {
      const { onRemoveTask } = renderTask({}, { active: true })
      const card = document.querySelector("[role='article']") as HTMLElement
      fireEvent.keyDown(card, { key: "x" })
      expect(onRemoveTask).toHaveBeenCalled()
    })

    it("M key calls onMoveToToday when not typing", () => {
      const { onMoveToToday } = renderTask({})
      const card = document.querySelector("[role='article']") as HTMLElement
      fireEvent.keyDown(card, { key: "m" })
      expect(onMoveToToday).toHaveBeenCalled()
    })

    it("does not trigger shortcuts when typing in textarea", () => {
      const { onUpdate, onRemoveTask } = renderTask(
        { pinned: false },
        { active: true }
      )
      const textarea = document.querySelector(
        "textarea[aria-label='Task title']"
      ) as HTMLElement
      fireEvent.keyDown(textarea, { key: "p" })
      fireEvent.keyDown(textarea, { key: "x" })
      expect(onUpdate).not.toHaveBeenCalled()
      expect(onRemoveTask).not.toHaveBeenCalled()
    })
  })

  describe("Checkbox click does not select task", () => {
    it("does not call onSelect when checkbox is tapped on inactive task", () => {
      const { onSelect } = renderTask()
      const checkbox = document.querySelector(
        "[role='checkbox']"
      ) as HTMLElement
      fireEvent.pointerUp(checkbox)
      expect(onSelect).not.toHaveBeenCalled()
    })

    it("calls onMarkAsComplete when checkbox is tapped", () => {
      vi.useFakeTimers()
      const { onMarkAsComplete } = renderTask()
      const checkbox = document.querySelector(
        "[role='checkbox']"
      ) as HTMLElement
      fireEvent.pointerUp(checkbox)
      vi.advanceTimersByTime(1500)
      expect(onMarkAsComplete).toHaveBeenCalled()
      vi.useRealTimers()
    })
  })

  describe("Mobile delete button visibility", () => {
    it("delete button is always rendered in the DOM", () => {
      renderTask()
      const deleteBtn = document.querySelector(
        "[aria-label='Delete task']"
      ) as HTMLElement
      expect(deleteBtn).toBeTruthy()
    })
  })
})
