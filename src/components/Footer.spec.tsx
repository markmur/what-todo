import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import Footer from "./Footer"
import { DarkModeProvider } from "../context/DarkModeContext"

// Mock StorageContext
vi.mock("../context/StorageContext", () => ({
  useStorage: () => ({
    data: { tasks: {}, labels: [], filters: [] },
    uploadData: vi.fn()
  })
}))

function renderFooter() {
  return render(
    <DarkModeProvider>
      <Footer />
    </DarkModeProvider>
  )
}

describe("Footer", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark")
  })

  afterEach(() => {
    document.documentElement.classList.remove("dark")
  })

  it("renders the dark mode toggle button", () => {
    const { getByRole } = renderFooter()
    const toggle = getByRole("button", { name: /switch to dark mode/i })
    expect(toggle).toBeTruthy()
  })

  it("toggles to dark mode when clicked", () => {
    const { getByRole } = renderFooter()
    const toggle = getByRole("button", { name: /switch to dark mode/i })
    fireEvent.click(toggle)

    expect(document.documentElement.classList.contains("dark")).toBe(true)
    // After toggling, the label changes to "Switch to light mode"
    const lightToggle = getByRole("button", { name: /switch to light mode/i })
    expect(lightToggle).toBeTruthy()
  })

  it("toggles back to light mode on second click", () => {
    const { getByRole } = renderFooter()
    fireEvent.click(getByRole("button", { name: /switch to dark mode/i }))
    fireEvent.click(getByRole("button", { name: /switch to light mode/i }))

    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })
})
