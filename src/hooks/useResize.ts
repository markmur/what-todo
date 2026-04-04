import { useCallback, useRef, useState } from "react"

interface UseResizeOptions {
  minWidth: number
  maxWidth: number
  onResize: (width: number) => void
  onResizeEnd: (width: number) => void
}

export default function useResize({
  minWidth,
  maxWidth,
  onResize,
  onResizeEnd
}: UseResizeOptions) {
  const [isResizing, setIsResizing] = useState(false)
  const widthRef = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      const handleMouseMove = (e: MouseEvent) => {
        const fraction = (window.innerWidth - e.clientX) / window.innerWidth
        const clamped = Math.min(maxWidth, Math.max(minWidth, fraction))
        widthRef.current = clamped
        onResize(clamped)
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        setIsResizing(false)
        onResizeEnd(widthRef.current)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [minWidth, maxWidth, onResize, onResizeEnd]
  )

  return { handleMouseDown, isResizing }
}
