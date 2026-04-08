import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import LoadingSkeleton from "./LoadingSkeleton"

describe("LoadingSkeleton", () => {
  it("renders with accessible status role and label", () => {
    render(<LoadingSkeleton />)
    const skeleton = screen.getByRole("status")
    expect(skeleton).toBeTruthy()
    expect(skeleton.getAttribute("aria-label")).toBe("Loading tasks")
  })

  it("has the correct test id", () => {
    render(<LoadingSkeleton />)
    expect(screen.getByTestId("loading-skeleton")).toBeTruthy()
  })

  it("renders skeleton task rows and a search bar placeholder", () => {
    render(<LoadingSkeleton />)
    const skeleton = screen.getByTestId("loading-skeleton")
    // Search bar + task rows should produce child content
    const rows =
      skeleton.querySelector(".divide-y")?.children ?? ([] as unknown)
    expect((rows as HTMLCollection).length).toBe(5)
  })

  it("includes screen reader text", () => {
    render(<LoadingSkeleton />)
    expect(screen.getByText("Loading tasks…")).toBeTruthy()
  })
})
