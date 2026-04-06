import { useEffect } from "react"

export default function useKeyboardAware() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const onResize = () => {
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
