import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal
} from "@floating-ui/react"
import { useState, useEffect, useRef } from "react"

export default function Tooltip() {
  const [content, setContent] = useState("")
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { refs, floatingStyles } = useFloating({
    open,
    placement: "top",
    middleware: [offset(6), flip(), shift()],
    whileElementsMounted: autoUpdate
  })

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return

    const handleOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.(
        "[data-tooltip-content]"
      ) as HTMLElement | null
      if (target) {
        clearTimeout(timeoutRef.current)
        const text = target.getAttribute("data-tooltip-content")
        if (!text) return
        setContent(text)
        refs.setReference(target)
        setOpen(true)
      }
    }

    const handleOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.(
        "[data-tooltip-content]"
      )
      if (target) {
        timeoutRef.current = setTimeout(() => setOpen(false), 50)
      }
    }

    const dismiss = () => setOpen(false)

    document.addEventListener("mouseover", handleOver)
    document.addEventListener("mouseout", handleOut)
    document.addEventListener("pointerdown", dismiss)
    document.addEventListener("scroll", dismiss, true)
    return () => {
      document.removeEventListener("mouseover", handleOver)
      document.removeEventListener("mouseout", handleOut)
      document.removeEventListener("pointerdown", dismiss)
      document.removeEventListener("scroll", dismiss, true)
      clearTimeout(timeoutRef.current)
    }
  }, [refs])

  if (!open || !content) return null

  return (
    <FloatingPortal>
      <div
        // eslint-disable-next-line react-hooks/refs
        ref={refs.setFloating}
        role="tooltip"
        style={floatingStyles}
        className="bg-black text-white text-xs rounded px-2 py-1 z-[70] pointer-events-none"
      >
        {content}
      </div>
    </FloatingPortal>
  )
}
