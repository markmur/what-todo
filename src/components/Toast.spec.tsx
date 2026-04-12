import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
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
    expect(screen.getByText("Task deleted")).toBeTruthy()
  })

  it("has role='alert' for screen readers", () => {
    render(<Toast message="Deleted" onDismiss={vi.fn()} />)
    expect(screen.getByRole("alert")).toBeTruthy()
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
    const button = screen.getByRole("button", { name: "Undo" })
    fireEvent.click(button)
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
    expect(screen.queryByRole("button")).toBeNull()
  })
})
