import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DataConflictSheet from "../DataConflictSheet"
import { Data } from "../../index.d"

const makeData = (taskTitles: string[] = []): Data => ({
  filters: [],
  tasks: taskTitles.length
    ? {
        "Wed Jan 01 2025": taskTitles.map((title, i) => ({
          id: `task-${i}`,
          title,
          completed: false,
          created_at: new Date("2025-01-01").toISOString(),
          labels: []
        }))
      }
    : {},
  labels: [],
  sections: {
    completed: { collapsed: true },
    focus: {},
    sidebar: { collapsed: false }
  }
})

const onUseRemote = vi.fn()
const onMerge = vi.fn()

describe("DataConflictSheet", () => {
  beforeEach(() => {
    onUseRemote.mockClear()
    onMerge.mockClear()
    if (!document.getElementById("portal")) {
      const el = document.createElement("div")
      el.id = "portal"
      document.body.appendChild(el)
    }
  })

  it("does not render when closed", () => {
    render(
      <DataConflictSheet
        open={false}
        local={null}
        remote={null}
        onUseRemote={onUseRemote}
        onMerge={onMerge}
      />
    )
    expect(screen.queryByText(/todos on this device/)).toBeNull()
  })

  it("renders task counts from both sides", () => {
    render(
      <DataConflictSheet
        open={true}
        local={makeData(["Task A", "Task B"])}
        remote={makeData(["Task C"])}
        onUseRemote={onUseRemote}
        onMerge={onMerge}
      />
    )
    expect(screen.getByText(/2 local task/)).toBeDefined()
    expect(screen.getAllByText(/1 cloud task/).length).toBeGreaterThan(0)
  })

  it("confirm button is disabled until a choice is made", () => {
    render(
      <DataConflictSheet
        open={true}
        local={makeData(["A"])}
        remote={makeData(["B"])}
        onUseRemote={onUseRemote}
        onMerge={onMerge}
      />
    )
    const btn = screen.getByRole("button", { name: /Select an option/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it("enables confirm and shows merge label after selecting merge", () => {
    render(
      <DataConflictSheet
        open={true}
        local={makeData(["A"])}
        remote={makeData(["B"])}
        onUseRemote={onUseRemote}
        onMerge={onMerge}
      />
    )
    fireEvent.click(screen.getByText("Merge both"))
    const btn = screen.getByRole("button", { name: /Merge 2 tasks/i })
    expect((btn as HTMLButtonElement).disabled).toBe(false)
  })

  it("shows warning when 'use cloud' is selected", () => {
    render(
      <DataConflictSheet
        open={true}
        local={makeData(["A", "B"])}
        remote={makeData(["C"])}
        onUseRemote={onUseRemote}
        onMerge={onMerge}
      />
    )
    fireEvent.click(screen.getByText("Use cloud data"))
    expect(screen.getByText(/discard your 2 local task/)).toBeDefined()
  })

  it("calls onMerge when merge is confirmed", () => {
    render(
      <DataConflictSheet
        open={true}
        local={makeData(["A"])}
        remote={makeData(["B"])}
        onUseRemote={onUseRemote}
        onMerge={onMerge}
      />
    )
    fireEvent.click(screen.getByText("Merge both"))
    fireEvent.click(screen.getByRole("button", { name: /Merge 2 tasks/i }))
    expect(onMerge).toHaveBeenCalled()
    expect(onUseRemote).not.toHaveBeenCalled()
  })

  it("calls onUseRemote when use cloud is confirmed", () => {
    render(
      <DataConflictSheet
        open={true}
        local={makeData(["A"])}
        remote={makeData(["B"])}
        onUseRemote={onUseRemote}
        onMerge={onMerge}
      />
    )
    fireEvent.click(screen.getByText("Use cloud data"))
    fireEvent.click(screen.getByRole("button", { name: /Use 1 cloud task/i }))
    expect(onUseRemote).toHaveBeenCalled()
    expect(onMerge).not.toHaveBeenCalled()
  })
})
