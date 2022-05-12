import * as React from "react"

// Hook
export default function useOnClickOutside(
  ref: React.Ref<HTMLElement>,
  handler: (event: Event) => void,
  options?: { ignore: string }
): void {
  React.useEffect(() => {
    const listener = event => {
      if (
        // @ts-ignore
        !ref.current ||
        // @ts-ignore
        ref.current.contains(event.target) ||
        event.target?.classList.contains(options?.ignore)
      ) {
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
