import * as React from "react"

// Hook
export default function useOnClickOutside(
  ref: React.Ref<HTMLElement>,
  handler: (event: Event) => void
): void {
  React.useEffect(() => {
    const listener = event => {
      // @ts-ignore
      if (!ref.current || ref.current.contains(event.target)) {
        return
      }

      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}
