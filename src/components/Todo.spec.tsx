import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import Todo from "./Todo"
import { SettingsProvider } from "../context/SettingsContext"
import { DarkModeProvider } from "../context/DarkModeContext"

const yesterday = new Date(Date.now() - 86400000).toDateString()

const mockMoveToToday = vi.fn()

let testData: Record<string, any> = {}
let testLoading = false

function makeDefaultData(overrides: Record<string, any> = {}) {
  return {
    tasks: {},
    labels: [
      { id: "l1", title: "Work", color: "#5352ed" },
      { id: "l2", title: "Personal", color: "#ff7f50" }
    ],
    filters: [],
    sections: {
      completed: { collapsed: false },
      focus: {},
      sidebar: { collapsed: false }
    },
    ...overrides
  }
}

vi.mock("../context/StorageContext", () => ({
  useStorage: () => ({
    data: testData,
    loading: testLoading,
    labelsById: {
      l1: { id: "l1", title: "Work", color: "#5352ed" },
      l2: { id: "l2", title: "Personal", color: "#ff7f50" }
    },
    sections: testData.sections,
    storage: {},
    fetchData: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    removeTask: vi.fn(),
    markAsComplete: vi.fn(),
    moveToToday: mockMoveToToday,
    addLabel: vi.fn(),
    updateLabel: vi.fn(),
    removeLabel: vi.fn(),
    updateFilters: vi.fn(),
    updateSection: vi.fn(),
    uploadData: vi.fn()
  })
}))

vi.mock("../hooks/media", () => ({
  default: () => 2,
  Breakpoints: { MOBILE: 0, TABLET: 1, DESKTOP: 2 },
  breakpoints: ["40em", "52em", "64em"]
}))

function renderTodo() {
  if (!document.getElementById("portal")) {
    const portal = document.createElement("div")
    portal.id = "portal"
    document.body.appendChild(portal)
  }

  return render(
    <DarkModeProvider>
      <SettingsProvider>
        <Todo />
      </SettingsProvider>
    </DarkModeProvider>
  )
}

describe("Todo — loading state", () => {
  beforeEach(() => {
    localStorage.clear()
    mockMoveToToday.mockClear()
    testData = makeDefaultData()
  })

  afterEach(() => {
    testLoading = false
  })

  it("shows loading skeleton and hides task list when loading is true", () => {
    testLoading = true
    renderTodo()
    expect(screen.queryByTestId("loading-skeleton")).toBeTruthy()
    expect(screen.queryByPlaceholderText("Search tasks...")).toBeNull()
  })

  it("does not show loading skeleton when loading is false", () => {
    testLoading = false
    renderTodo()
    expect(screen.queryByTestId("loading-skeleton")).toBeNull()
  })
})

describe("Todo — curtain sidebar animation", () => {
  beforeEach(() => {
    localStorage.clear()
    mockMoveToToday.mockClear()
    testData = makeDefaultData()
  })

  it("always renders the completed section in the DOM", () => {
    renderTodo()
    const completedHeading = Array.from(document.querySelectorAll("h1")).find(
      el => el.textContent === "Completed"
    )
    expect(completedHeading).toBeTruthy()
  })

  it("always renders the sidebar section in the DOM", () => {
    renderTodo()
    const labelsHeading = Array.from(document.querySelectorAll("h1, h2")).find(
      el => el.textContent === "Labels"
    )
    expect(labelsHeading).toBeTruthy()
  })

  it("positions completed section absolutely at left edge", () => {
    renderTodo()
    const completedHeading = Array.from(document.querySelectorAll("h1")).find(
      el => el.textContent === "Completed"
    )
    const section = completedHeading?.closest(
      "[style*='position: absolute']"
    ) as HTMLElement
    expect(section).toBeTruthy()
    expect(section.style.left).toBe("0px")
  })

  it("positions sidebar section absolutely at right edge", () => {
    renderTodo()
    const labelsHeading = Array.from(document.querySelectorAll("h1, h2")).find(
      el => el.textContent === "Labels"
    )
    const section = labelsHeading?.closest(
      "[style*='position: absolute']"
    ) as HTMLElement
    expect(section).toBeTruthy()
    expect(section.style.right).toBe("0px")
  })

  it("focus section has left offset when completed is expanded", () => {
    renderTodo()
    const section = document.querySelector(
      "[style*='z-index: 1']"
    ) as HTMLElement
    expect(section).toBeTruthy()
    expect(section.style.left).not.toBe("0px")
    expect(section.style.left).not.toBe("0")
  })

  it("focus section has right offset when sidebar is expanded", () => {
    renderTodo()
    const section = document.querySelector(
      "[style*='z-index: 1']"
    ) as HTMLElement
    expect(section).toBeTruthy()
    expect(section.style.right).not.toBe("0px")
    expect(section.style.right).not.toBe("0")
  })

  it("focus section has no transition on initial render (prevents flash)", () => {
    renderTodo()
    const section = document.querySelector(
      "[style*='z-index: 1']"
    ) as HTMLElement
    expect(section).toBeTruthy()
    expect(section.style.transition).toBe("")
  })

  it("focus section renders above sidebars (z-index)", () => {
    renderTodo()
    const section = document.querySelector(
      "[style*='z-index: 1']"
    ) as HTMLElement
    expect(section).toBeTruthy()
    expect(section.style.zIndex).toBe("1")
  })

  it("sidebar has pointer-events: auto when expanded", () => {
    renderTodo()
    const labelsHeading = Array.from(document.querySelectorAll("h1, h2")).find(
      el => el.textContent === "Labels"
    )
    const section = labelsHeading?.closest(
      "[style*='position: absolute']"
    ) as HTMLElement
    expect(section).toBeTruthy()
    expect(section.style.pointerEvents).toBe("auto")
  })

  it("completed section has pointer-events: auto when expanded", () => {
    renderTodo()
    const completedHeading = Array.from(document.querySelectorAll("h1")).find(
      el => el.textContent === "Completed"
    )
    const section = completedHeading?.closest(
      "[style*='position: absolute']"
    ) as HTMLElement
    expect(section).toBeTruthy()
    expect(section.style.pointerEvents).toBe("auto")
  })
})

describe("Todo — older task migration", () => {
  beforeEach(() => {
    localStorage.clear()
    mockMoveToToday.mockClear()
  })

  it("moves uncompleted older tasks to today", () => {
    testData = makeDefaultData({
      tasks: {
        [yesterday]: [
          {
            id: "old-1",
            title: "Unfinished task",
            completed: false,
            created_at: new Date(yesterday).toISOString(),
            labels: []
          },
          {
            id: "old-2",
            title: "Done task",
            completed: true,
            created_at: new Date(yesterday).toISOString(),
            labels: []
          }
        ]
      }
    })

    renderTodo()

    expect(mockMoveToToday).toHaveBeenCalledWith(
      expect.objectContaining({ id: "old-1", completed: false })
    )
    expect(mockMoveToToday).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: "old-2" })
    )
  })

  it("does not move completed older tasks", () => {
    testData = makeDefaultData({
      tasks: {
        [yesterday]: [
          {
            id: "old-done",
            title: "Completed yesterday",
            completed: true,
            created_at: new Date(yesterday).toISOString(),
            labels: []
          }
        ]
      }
    })

    renderTodo()

    expect(mockMoveToToday).not.toHaveBeenCalled()
  })

  it("completed sidebar only shows completed tasks", () => {
    testData = makeDefaultData({
      tasks: {
        [yesterday]: [
          {
            id: "old-incomplete",
            title: "Should not appear",
            completed: false,
            created_at: new Date(yesterday).toISOString(),
            labels: []
          },
          {
            id: "old-complete",
            title: "Should appear in completed",
            completed: true,
            created_at: new Date(yesterday).toISOString(),
            labels: []
          }
        ]
      }
    })

    renderTodo()

    const completedHeading = Array.from(document.querySelectorAll("h1")).find(
      el => el.textContent === "Completed"
    )
    const completedSection = completedHeading?.closest(
      "[style*='position: absolute']"
    ) as HTMLElement

    expect(completedSection).toBeTruthy()
    expect(completedSection.textContent).not.toContain("Should not appear")
  })
})
