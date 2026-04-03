import React from "react"
import cx from "classnames"

interface ToggleButtonProps {
  /** Whether the associated section is currently collapsed */
  collapsed?: boolean
  /** Which side of the content the button sits on */
  side: "left" | "right"
  /** Called when the button is clicked */
  onClick: () => void
}

/**
 * Derive arrow direction from the toggle's position and section state.
 *
 * When the section is expanded, the arrow points inward (toward the content)
 * to indicate "collapse." When collapsed, it points outward to indicate
 * "expand."
 *
 * - left side, expanded  → points right (inward, toward content)
 * - left side, collapsed → points left  (outward, away from content)
 * - right side, expanded → points left  (inward, toward content)
 * - right side, collapsed→ points right (outward, away from content)
 */
export function getPointsRight(side: "left" | "right", collapsed?: boolean): boolean {
  return (side === "left" && !collapsed) || (side === "right" && !!collapsed)
}

/**
 * A small rounded rectangular toggle button that sits vertically centered
 * beside a sidebar section. On hover, the rectangle bends to form an arrow
 * shape pointing in the direction the section will expand/collapse toward.
 */
const ToggleButton: React.FC<ToggleButtonProps> = ({
  collapsed,
  side,
  onClick
}) => {
  const pointsRight = getPointsRight(side, collapsed)

  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? "Expand section" : "Collapse section"}
      className="group flex flex-col items-center justify-center w-5 h-12 cursor-pointer bg-transparent border-none p-0 shrink-0"
    >
      <span
        className={cx(
          "block w-1 h-5 bg-slate-300 dark:bg-navy-600 rounded-t transition-all duration-200 origin-bottom",
          "group-hover:bg-slate-500 dark:group-hover:bg-navy-400",
          pointsRight
            ? "group-hover:rotate-[12deg]"
            : "group-hover:-rotate-[12deg]"
        )}
      />
      <span
        className={cx(
          "block w-1 h-5 bg-slate-300 dark:bg-navy-600 rounded-b transition-all duration-200 origin-top",
          "group-hover:bg-slate-500 dark:group-hover:bg-navy-400",
          pointsRight
            ? "group-hover:-rotate-[12deg]"
            : "group-hover:rotate-[12deg]"
        )}
      />
    </button>
  )
}

export default ToggleButton
