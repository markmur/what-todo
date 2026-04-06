import { useEffect, useRef } from "react"

export default function useKeyboardAware() {
  const prevHeight = useRef(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    prevHeight.current = vv.height

    const onResize = () => {
      const delta = Math.abs(vv.height - prevHeight.current)
      prevHeight.current = vv.height

      if (delta < 100) return

      const active = document.activeElement as HTMLElement | null
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") {
        requestAnimationFrame(() => {
          active.scrollIntoView({ block: "nearest", behavior: "smooth" })
        })
      }
    }

    vv.addEventListener("resize", onResize)
    return () => vv.removeEventListener("resize", onResize)
  }, [])
}
