import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import Collapse from "./Collapse"

describe("Collapse", () => {
  it("renders children when open", () => {
    const { getByText } = render(
      <Collapse open>
        <span>visible</span>
      </Collapse>
    )
    expect(getByText("visible")).toBeTruthy()
  })

  it("keeps children in DOM when closed", () => {
    const { getByText } = render(
      <Collapse open={false}>
        <span>still here</span>
      </Collapse>
    )
    expect(getByText("still here")).toBeTruthy()
  })

  it("uses grid-template-rows: 1fr when open", () => {
    const { container } = render(
      <Collapse open>
        <span>content</span>
      </Collapse>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.gridTemplateRows).toBe("1fr")
  })

  it("uses grid-template-rows: 0fr when closed", () => {
    const { container } = render(
      <Collapse open={false}>
        <span>content</span>
      </Collapse>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.gridTemplateRows).toBe("0fr")
  })

  it("has opacity 1 when open", () => {
    const { container } = render(
      <Collapse open>
        <span>content</span>
      </Collapse>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.opacity).toBe("1")
  })

  it("has opacity 0 when closed", () => {
    const { container } = render(
      <Collapse open={false}>
        <span>content</span>
      </Collapse>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.opacity).toBe("0")
  })

  it("has CSS transition for smooth animation", () => {
    const { container } = render(
      <Collapse open>
        <span>content</span>
      </Collapse>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.transition).toContain("grid-template-rows")
    expect(wrapper.style.transition).toContain("opacity")
  })

  it("inner wrapper has overflow hidden", () => {
    const { container } = render(
      <Collapse open>
        <span>content</span>
      </Collapse>
    )
    const inner = (container.firstChild as HTMLElement)
      .firstChild as HTMLElement
    expect(inner.style.overflow).toBe("hidden")
  })

  it("accepts custom duration", () => {
    const { container } = render(
      <Collapse open duration={0.5}>
        <span>content</span>
      </Collapse>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.transition).toContain("0.5s")
  })
})
