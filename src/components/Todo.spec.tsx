import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import Todo from "./Todo"
import { SettingsProvider } from "../context/SettingsContext"
import { DarkModeProvider } from "../context/DarkModeContext"

const defaultData = {
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
  }
}

vi.mock("../context/StorageContext", () => ({
  useStorage: () => ({
    data: defaultData,
    labelsById: {
      l1: { id: "l1", title: "Work", color: "#5352ed" },
      l2: { id: "l2", title: "Personal", color: "#ff7f50" }
    },
    sections: defaultData.sections,
    storage: {},
    fetchData: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    removeTask: vi.fn(),
    markAsComplete: vi.fn(),
    moveToToday: vi.fn(),
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

describe("Todo — curtain sidebar animation", () => {
  beforeEach(() => {
    localStorage.clear()
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
