import { describe, it, expect, beforeEach } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import { SettingsProvider, useSettings } from "./SettingsContext"

function TestConsumer() {
  const { settings, updateSetting } = useSettings()
  return (
    <div>
      <span data-testid="sortBy">{settings.sortBy}</span>
      <span data-testid="compactMode">{String(settings.compactMode)}</span>
      <span data-testid="labelStyle">{settings.labelStyle}</span>
      <button onClick={() => updateSetting("compactMode", true)}>
        enable compact
      </button>
      <button onClick={() => updateSetting("sortBy", "label")}>
        sort by label
      </button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <SettingsProvider>
      <TestConsumer />
    </SettingsProvider>
  )
}

describe("SettingsContext", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("provides default settings", () => {
    const { getByTestId } = renderWithProvider()
    expect(getByTestId("sortBy").textContent).toBe("pinned")
    expect(getByTestId("compactMode").textContent).toBe("false")
    expect(getByTestId("labelStyle").textContent).toBe("circle")
  })

  it("updates a setting", () => {
    const { getByTestId, getByText } = renderWithProvider()
    fireEvent.click(getByText("enable compact"))
    expect(getByTestId("compactMode").textContent).toBe("true")
  })

  it("persists settings to localStorage", () => {
    const { getByText } = renderWithProvider()
    fireEvent.click(getByText("sort by label"))
    const stored = JSON.parse(
      localStorage.getItem("what-todo-settings") ?? "{}"
    )
    expect(stored.sortBy).toBe("label")
  })

  it("restores settings from localStorage", () => {
    localStorage.setItem(
      "what-todo-settings",
      JSON.stringify({ compactMode: true, sortBy: "created" })
    )
    const { getByTestId } = renderWithProvider()
    expect(getByTestId("compactMode").textContent).toBe("true")
    expect(getByTestId("sortBy").textContent).toBe("created")
  })

  it("merges stored settings with defaults for new keys", () => {
    localStorage.setItem(
      "what-todo-settings",
      JSON.stringify({ compactMode: true })
    )
    const { getByTestId } = renderWithProvider()
    expect(getByTestId("compactMode").textContent).toBe("true")
    expect(getByTestId("labelStyle").textContent).toBe("circle")
  })
})
