import React from "react"

// Hook
export default function useOnClickOutside(
  ref: React.MutableRefObject<any>,
  handle: (event: Event) => void,
  options?: { ignore: string }
): void {
  React.useEffect(() => {
    const listener = (event: any) => {
      if (!ref || !ref.current) {
        return handle(event)
      }

      if (
        !ref.current ||
        ref.current.contains(event.target) ||
        (options?.ignore && event.target?.classList.contains(options?.ignore))
      ) {
        return
      }

      handle(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handle])
}
