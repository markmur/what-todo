import { useEffect, useRef } from "react"

export default function useKeyboardAware() {
  const prevHeight = useRef(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    prevHeight.current = vv.height

    const onResize = () => {
      const active = document.activeElement as HTMLElement | null
      const isInput =
        active?.tagName === "INPUT" || active?.tagName === "TEXTAREA"

      if (vv.height > prevHeight.current && isInput) {
        active.blur()
      } else if (vv.height < prevHeight.current && isInput) {
        requestAnimationFrame(() => {
          active.scrollIntoView({ block: "nearest", behavior: "smooth" })
        })
      }

      prevHeight.current = vv.height
    }

    vv.addEventListener("resize", onResize)
    return () => vv.removeEventListener("resize", onResize)
  }, [])
}
