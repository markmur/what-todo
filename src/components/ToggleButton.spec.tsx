import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import ToggleButton, { getPointsRight } from "./ToggleButton"

describe("getPointsRight", () => {
  it("points right when left side and expanded", () => {
    expect(getPointsRight("left", false)).toBe(true)
  })

  it("points left when left side and collapsed", () => {
    expect(getPointsRight("left", true)).toBe(false)
  })

  it("points right when right side and collapsed", () => {
    expect(getPointsRight("right", true)).toBe(true)
  })

  it("points left when right side and expanded", () => {
    expect(getPointsRight("right", false)).toBe(false)
  })

  it("treats undefined collapsed as expanded (not collapsed)", () => {
    expect(getPointsRight("left", undefined)).toBe(true)
    expect(getPointsRight("right", undefined)).toBe(false)
  })
})

describe("ToggleButton", () => {
  it("renders with 'Collapse section' aria-label when expanded", () => {
    const { getByRole } = render(
      <ToggleButton collapsed={false} side="left" onClick={() => {}} />
    )
    const button = getByRole("button")
    expect(button.getAttribute("aria-label")).toBe("Collapse section")
  })

  it("renders with 'Expand section' aria-label when collapsed", () => {
    const { getByRole } = render(
      <ToggleButton collapsed={true} side="right" onClick={() => {}} />
    )
    const button = getByRole("button")
    expect(button.getAttribute("aria-label")).toBe("Expand section")
  })

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn()
    const { getByRole } = render(
      <ToggleButton collapsed={false} side="left" onClick={handleClick} />
    )
    fireEvent.click(getByRole("button"))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("shows 'Collapse section' when expanded (pointsRight=true)", () => {
    const { getByRole } = render(
      <ToggleButton collapsed={false} side="left" onClick={() => {}} />
    )
    expect(getByRole("button").getAttribute("aria-label")).toBe(
      "Collapse section"
    )
  })

  it("shows 'Expand section' when collapsed (pointsRight=false)", () => {
    const { getByRole } = render(
      <ToggleButton collapsed={true} side="left" onClick={() => {}} />
    )
    expect(getByRole("button").getAttribute("aria-label")).toBe(
      "Expand section"
    )
  })
})
