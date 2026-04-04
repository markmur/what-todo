import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import Label from "./Label"

const defaultLabel = { id: "l1", title: "Work", color: "#5352ed" }

describe("Label", () => {
  it("renders label title", () => {
    const { getByText } = render(
      <Label label={defaultLabel} active={false} />
    )
    expect(getByText("Work")).toBeTruthy()
  })

  it("renders as a button element", () => {
    const { container } = render(
      <Label label={defaultLabel} active={false} />
    )
    expect(container.querySelector("button")).toBeTruthy()
  })

  it("calls onClick when clicked", () => {
    const onClick = vi.fn()
    const { getByText } = render(
      <Label label={defaultLabel} active={false} onClick={onClick} />
    )
    fireEvent.click(getByText("Work"))
    expect(onClick).toHaveBeenCalled()
  })

  it("applies background color when active", () => {
    const { container } = render(
      <Label label={defaultLabel} active={true} />
    )
    const button = container.querySelector("button") as HTMLElement
    expect(button.style.backgroundColor).toBeTruthy()
  })

  it("renders remove icon when onRemove is provided", () => {
    const onRemove = vi.fn()
    const { container } = render(
      <Label label={defaultLabel} active={false} onRemove={onRemove} />
    )
    const removeSpan = container.querySelector(
      "[aria-label='Remove Work']"
    )
    expect(removeSpan).toBeTruthy()
  })

  it("calls onRemove when remove icon is clicked", () => {
    const onRemove = vi.fn()
    const { container } = render(
      <Label label={defaultLabel} active={false} onRemove={onRemove} />
    )
    const removeSpan = container.querySelector(
      "[aria-label='Remove Work']"
    ) as HTMLElement
    fireEvent.click(removeSpan)
    expect(onRemove).toHaveBeenCalled()
  })

  it("does not render remove icon when onRemove is not provided", () => {
    const { container } = render(
      <Label label={defaultLabel} active={false} />
    )
    const removeSpan = container.querySelector("[aria-label]")
    expect(removeSpan).toBeNull()
  })
})
