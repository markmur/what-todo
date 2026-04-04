import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import Checkbox from "./Checkbox"

describe("Checkbox", () => {
  it("renders unchecked state", () => {
    const { container } = render(
      <Checkbox id="test" checked={false} onChange={vi.fn()} />
    )
    const input = container.querySelector(
      "input[type='checkbox']"
    ) as HTMLInputElement
    expect(input.checked).toBe(false)
  })

  it("renders checked state", () => {
    const { container } = render(
      <Checkbox id="test" checked={true} onChange={vi.fn()} />
    )
    const input = container.querySelector(
      "input[type='checkbox']"
    ) as HTMLInputElement
    expect(input.checked).toBe(true)
  })

  it("calls onChange with toggled value on click", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Checkbox id="test" checked={false} onChange={onChange} />
    )
    const input = container.querySelector(
      "input[type='checkbox']"
    ) as HTMLInputElement
    fireEvent.click(input)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("calls onChange with false when unchecking", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Checkbox id="test" checked={true} onChange={onChange} />
    )
    const input = container.querySelector(
      "input[type='checkbox']"
    ) as HTMLInputElement
    fireEvent.click(input)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it("has a label element for accessibility", () => {
    const { container } = render(
      <Checkbox id="test-id" checked={false} onChange={vi.fn()} />
    )
    const label = container.querySelector("label[for='test-id']")
    expect(label).toBeTruthy()
  })
})
