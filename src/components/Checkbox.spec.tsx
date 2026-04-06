import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import Checkbox from "./Checkbox"

describe("Checkbox", () => {
  it("renders unchecked state", () => {
    const { container } = render(
      <Checkbox id="test" checked={false} onChange={vi.fn()} />
    )
    const span = container.querySelector("[role='checkbox']") as HTMLElement
    expect(span.getAttribute("aria-checked")).toBe("false")
  })

  it("renders checked state", () => {
    const { container } = render(
      <Checkbox id="test" checked={true} onChange={vi.fn()} />
    )
    const span = container.querySelector("[role='checkbox']") as HTMLElement
    expect(span.getAttribute("aria-checked")).toBe("true")
  })

  it("calls onChange with toggled value on pointerUp", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Checkbox id="test" checked={false} onChange={onChange} />
    )
    const span = container.querySelector("[role='checkbox']") as HTMLElement
    fireEvent.pointerUp(span)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("calls onChange with false when unchecking", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Checkbox id="test" checked={true} onChange={onChange} />
    )
    const span = container.querySelector("[role='checkbox']") as HTMLElement
    fireEvent.pointerUp(span)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it("has proper ARIA attributes for accessibility", () => {
    const { container } = render(
      <Checkbox id="test-id" checked={false} onChange={vi.fn()} />
    )
    const span = container.querySelector("[role='checkbox']") as HTMLElement
    expect(span).toBeTruthy()
    expect(span.getAttribute("aria-label")).toBe("Toggle complete")
    expect(span.getAttribute("tabindex")).toBe("0")
  })
})
