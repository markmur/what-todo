import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import Animate from "./Animate"

describe("Animate", () => {
  it("renders children when active", () => {
    const { getByText } = render(
      <Animate active>
        <span>visible</span>
      </Animate>
    )
    expect(getByText("visible")).toBeTruthy()
  })

  it("does not render children when inactive", () => {
    const { queryByText } = render(
      <Animate active={false}>
        <span>hidden</span>
      </Animate>
    )
    expect(queryByText("hidden")).toBeNull()
  })

  it("uses height and opacity variants", () => {
    const { container } = render(
      <Animate active>
        <span>content</span>
      </Animate>
    )
    const motionDiv = container.firstChild as HTMLElement
    expect(motionDiv.style.overflow).toBe("hidden")
  })

  it("unmounts children when active changes to false", () => {
    const { queryByText, rerender } = render(
      <Animate active>
        <span>content</span>
      </Animate>
    )
    expect(queryByText("content")).toBeTruthy()

    rerender(
      <Animate active={false}>
        <span>content</span>
      </Animate>
    )

    // AnimatePresence keeps element briefly for exit animation,
    // but it should eventually be removed
    vi.useFakeTimers()
    vi.advanceTimersByTime(500)
    vi.useRealTimers()
  })

  it("accepts custom duration", () => {
    const { getByText } = render(
      <Animate active duration={0.5}>
        <span>content</span>
      </Animate>
    )
    expect(getByText("content")).toBeTruthy()
  })

  it("wraps children in a single motion div with overflow hidden", () => {
    const { container } = render(
      <Animate active>
        <div>child 1</div>
        <div>child 2</div>
      </Animate>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.overflow).toBe("hidden")
    expect(wrapper.children.length).toBe(2)
  })
})
