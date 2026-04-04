import React from "react"

interface CollapseProps {
  open: boolean
  duration?: number
  children: React.ReactNode
}

export default function Collapse({
  open,
  duration = 0.25,
  children
}: CollapseProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        opacity: open ? 1 : 0,
        transition: `grid-template-rows ${duration}s ease, opacity ${duration}s ease`
      }}
    >
      <div style={{ overflow: "hidden" }}>{children}</div>
    </div>
  )
}
