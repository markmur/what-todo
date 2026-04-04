import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import Toast from "./Toast"

beforeEach(() => {
  if (!document.getElementById("portal")) {
    const portal = document.createElement("div")
    portal.id = "portal"
    document.body.appendChild(portal)
  }
})

describe("Toast", () => {
  it("renders the message", () => {
    render(<Toast message="Task deleted" onDismiss={vi.fn()} />)
    expect(document.body.textContent).toContain("Task deleted")
  })

  it("has role='alert' for screen readers", () => {
    render(<Toast message="Deleted" onDismiss={vi.fn()} />)
    const alert = document.querySelector("[role='alert']")
    expect(alert).toBeTruthy()
  })

  it("renders an action button when provided", () => {
    const onClick = vi.fn()
    render(
      <Toast
        message="Deleted"
        action={{ label: "Undo", onClick }}
        onDismiss={vi.fn()}
      />
    )
    const button = document.querySelector("button")
    expect(button?.textContent).toBe("Undo")
    fireEvent.click(button!)
    expect(onClick).toHaveBeenCalled()
  })

  it("calls onDismiss after duration", () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast message="Deleted" duration={2000} onDismiss={onDismiss} />)
    expect(onDismiss).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2000)
    expect(onDismiss).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it("does not render action button when not provided", () => {
    render(<Toast message="Deleted" onDismiss={vi.fn()} />)
    const buttons = document.querySelectorAll("button")
    expect(buttons.length).toBe(0)
  })
})
