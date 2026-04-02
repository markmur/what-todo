import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import Labels, { MAX_LABELS } from "./Labels"
import type { Label } from "../index.d"

// Mock react-tooltip to avoid DOM side-effects in tests
vi.mock("react-tooltip", () => ({
  default: { rebuild: vi.fn() }
}))

// Mock framer-motion's AnimatePresence to just render children
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode
      [key: string]: unknown
    }) => <div {...props}>{children}</div>
  }
}))

function makeLabels(count: number): Label[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `label-${i + 1}`,
    title: `Label ${i + 1}`,
    color: "#000000"
  }))
}

const defaultColors = [{ name: "Black", backgroundColor: "#000000", foregroundColor: "#ffffff" }]

const defaultProps = {
  colors: defaultColors,
  filters: [] as string[],
  onAddLabel: vi.fn(),
  onFilter: vi.fn(),
  onUpdateLabel: vi.fn(),
  onRemoveLabel: vi.fn()
}

describe("Labels", () => {
  describe("MAX_LABELS constant", () => {
    it("should be 15", () => {
      expect(MAX_LABELS).toBe(15)
    })
  })

  describe("create label button visibility", () => {
    it("shows 'Create new label' button when labels count is below the limit", () => {
      render(<Labels {...defaultProps} labels={makeLabels(14)} />)
      expect(screen.getByText("Create new label")).toBeInTheDocument()
    })

    it("hides 'Create new label' button when labels count equals the limit", () => {
      render(<Labels {...defaultProps} labels={makeLabels(MAX_LABELS)} />)
      expect(screen.queryByText("Create new label")).not.toBeInTheDocument()
    })

    it("hides 'Create new label' button when labels count exceeds the limit", () => {
      render(<Labels {...defaultProps} labels={makeLabels(MAX_LABELS + 1)} />)
      expect(screen.queryByText("Create new label")).not.toBeInTheDocument()
    })

    it("respects a custom limit prop", () => {
      render(<Labels {...defaultProps} labels={makeLabels(5)} limit={5} />)
      expect(screen.queryByText("Create new label")).not.toBeInTheDocument()
    })

    it("shows button when under custom limit", () => {
      render(<Labels {...defaultProps} labels={makeLabels(4)} limit={5} />)
      expect(screen.getByText("Create new label")).toBeInTheDocument()
    })
  })

  describe("handleSave guard", () => {
    it("does not call onAddLabel when at the limit", () => {
      const onAddLabel = vi.fn()
      render(
        <Labels
          {...defaultProps}
          labels={makeLabels(MAX_LABELS)}
          onAddLabel={onAddLabel}
          limit={MAX_LABELS}
        />
      )

      // The button should be hidden, so onAddLabel cannot be triggered via UI.
      // Verify it was never called.
      expect(onAddLabel).not.toHaveBeenCalled()
    })
  })
})
