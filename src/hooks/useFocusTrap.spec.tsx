import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import React, { useRef } from "react"
import useFocusTrap from "./useFocusTrap"

function TrapTest({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, active)
  return (
    <div ref={ref}>
      <button data-testid="first">First</button>
      <button data-testid="second">Second</button>
      <button data-testid="last">Last</button>
    </div>
  )
}

describe("useFocusTrap", () => {
  it("focuses the first element when active", () => {
    const { getByTestId } = render(<TrapTest active />)
    expect(document.activeElement).toBe(getByTestId("first"))
  })

  it("does not focus anything when inactive", () => {
    render(<TrapTest active={false} />)
    expect(document.activeElement).toBe(document.body)
  })

  it("wraps Tab from last to first", () => {
    const { getByTestId } = render(<TrapTest active />)
    getByTestId("last").focus()
    fireEvent.keyDown(getByTestId("last").parentElement!, {
      key: "Tab"
    })
    expect(document.activeElement).toBe(getByTestId("first"))
  })

  it("wraps Shift+Tab from first to last", () => {
    const { getByTestId } = render(<TrapTest active />)
    getByTestId("first").focus()
    fireEvent.keyDown(getByTestId("first").parentElement!, {
      key: "Tab",
      shiftKey: true
    })
    expect(document.activeElement).toBe(getByTestId("last"))
  })
})
