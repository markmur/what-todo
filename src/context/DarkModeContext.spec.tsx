import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import { DarkModeProvider, useDarkMode } from "./DarkModeContext"

function TestConsumer() {
  const { darkMode, toggleDarkMode } = useDarkMode()
  return (
    <div>
      <span data-testid="mode">{darkMode ? "dark" : "light"}</span>
      <button onClick={toggleDarkMode}>toggle</button>
    </div>
  )
}

describe("DarkModeContext", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark")
  })

  afterEach(() => {
    document.documentElement.classList.remove("dark")
  })

  it("defaults to dark mode when no localStorage value", () => {
    const { getByTestId } = render(
      <DarkModeProvider>
        <TestConsumer />
      </DarkModeProvider>
    )
    expect(getByTestId("mode").textContent).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("initializes from localStorage", () => {
    localStorage.setItem("what-todo-dark-mode", "false")
    const { getByTestId } = render(
      <DarkModeProvider>
        <TestConsumer />
      </DarkModeProvider>
    )
    expect(getByTestId("mode").textContent).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("toggles dark mode off and on", () => {
    const { getByTestId, getByText } = render(
      <DarkModeProvider>
        <TestConsumer />
      </DarkModeProvider>
    )

    expect(getByTestId("mode").textContent).toBe("dark")

    fireEvent.click(getByText("toggle"))
    expect(getByTestId("mode").textContent).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(localStorage.getItem("what-todo-dark-mode")).toBe("false")

    fireEvent.click(getByText("toggle"))
    expect(getByTestId("mode").textContent).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("what-todo-dark-mode")).toBe("true")
  })

  it("persists preference to localStorage", () => {
    const { getByText } = render(
      <DarkModeProvider>
        <TestConsumer />
      </DarkModeProvider>
    )

    fireEvent.click(getByText("toggle"))
    expect(localStorage.getItem("what-todo-dark-mode")).toBe("false")
  })
})
