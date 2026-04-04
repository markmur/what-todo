import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import MobileDrawer from "./MobileDrawer"

beforeEach(() => {
  if (!document.getElementById("portal")) {
    const portal = document.createElement("div")
    portal.id = "portal"
    document.body.appendChild(portal)
  }
})

describe("MobileDrawer", () => {
  it("renders children when open", () => {
    render(
      <MobileDrawer open onClose={vi.fn()}>
        <span>Drawer content</span>
      </MobileDrawer>
    )
    expect(document.body.textContent).toContain("Drawer content")
  })

  it("does not render children when closed", () => {
    render(
      <MobileDrawer open={false} onClose={vi.fn()}>
        <span>Drawer content</span>
      </MobileDrawer>
    )
    expect(document.body.textContent).not.toContain("Drawer content")
  })

  it("renders a close button with aria-label", () => {
    render(
      <MobileDrawer open onClose={vi.fn()}>
        <span>Content</span>
      </MobileDrawer>
    )
    const closeButton = document.querySelector(
      "[aria-label='Close menu']"
    )
    expect(closeButton).toBeTruthy()
  })

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn()
    render(
      <MobileDrawer open onClose={onClose}>
        <span>Content</span>
      </MobileDrawer>
    )
    const closeButton = document.querySelector(
      "[aria-label='Close menu']"
    ) as HTMLElement
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })

  it("calls onClose on Escape key", () => {
    const onClose = vi.fn()
    render(
      <MobileDrawer open onClose={onClose}>
        <span>Content</span>
      </MobileDrawer>
    )
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })

  it("has dialog role and aria-modal", () => {
    render(
      <MobileDrawer open onClose={vi.fn()}>
        <span>Content</span>
      </MobileDrawer>
    )
    const dialog = document.querySelector("[role='dialog']")
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute("aria-modal")).toBe("true")
  })

  it("renders footer when provided", () => {
    render(
      <MobileDrawer open onClose={vi.fn()} footer={<span>Footer</span>}>
        <span>Content</span>
      </MobileDrawer>
    )
    expect(document.body.textContent).toContain("Footer")
  })
})
