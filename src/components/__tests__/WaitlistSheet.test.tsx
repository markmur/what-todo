import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import WaitlistSheet from "../WaitlistSheet"

// Mock the supabase client
let insertResult: { error: { code?: string; message: string } | null } = {
  error: null
}

vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: () => ({
      insert: async () => insertResult
    })
  }
}))

// Portal renders into document.body — no extra setup needed with happy-dom

const onClose = vi.fn()

describe("WaitlistSheet", () => {
  beforeEach(() => {
    insertResult = { error: null }
    onClose.mockClear()
    // Portal renders into #portal — create it if missing
    if (!document.getElementById("portal")) {
      const el = document.createElement("div")
      el.id = "portal"
      document.body.appendChild(el)
    }
  })

  it("does not render when closed", () => {
    render(<WaitlistSheet open={false} onClose={onClose} />)
    expect(screen.queryByText("Early access only")).toBeNull()
  })

  it("renders the form when open", () => {
    render(<WaitlistSheet open={true} onClose={onClose} />)
    expect(screen.getByText("Early access only")).toBeDefined()
    expect(screen.getByPlaceholderText("you@example.com")).toBeDefined()
    expect(screen.getByText("Request access")).toBeDefined()
  })

  it("shows validation error for invalid email", async () => {
    render(<WaitlistSheet open={true} onClose={onClose} />)
    const input = screen.getByPlaceholderText("you@example.com")
    fireEvent.change(input, { target: { value: "notanemail" } })
    fireEvent.submit(input.closest("form")!)
    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address.")
      ).toBeDefined()
    })
  })

  it("shows success state after valid submission", async () => {
    render(<WaitlistSheet open={true} onClose={onClose} />)
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" }
    })
    fireEvent.click(screen.getByText("Request access"))
    await waitFor(() => {
      expect(screen.getByText("You're on the list")).toBeDefined()
    })
  })

  it("treats duplicate email as success", async () => {
    insertResult = { error: { code: "23505", message: "duplicate key" } }
    render(<WaitlistSheet open={true} onClose={onClose} />)
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "existing@example.com" }
    })
    fireEvent.click(screen.getByText("Request access"))
    await waitFor(() => {
      expect(screen.getByText("You're on the list")).toBeDefined()
    })
  })

  it("shows error message on unexpected failure", async () => {
    insertResult = { error: { message: "network error" } }
    render(<WaitlistSheet open={true} onClose={onClose} />)
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" }
    })
    fireEvent.click(screen.getByText("Request access"))
    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong. Please try again.")
      ).toBeDefined()
    })
  })

  it("calls onClose when backdrop is clicked", () => {
    render(<WaitlistSheet open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText("Maybe later"))
    expect(onClose).toHaveBeenCalled()
  })
})
