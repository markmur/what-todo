import React from "react"

export const breakpoints = ["40em", "52em", "64em"]

export enum Breakpoints {
  MOBILE,
  TABLET,
  DESKTOP
}

const values = [Breakpoints.MOBILE, Breakpoints.TABLET, Breakpoints.DESKTOP]

export default function useMedia(
  defaultValue = Breakpoints.DESKTOP
): Breakpoints {
  const mediaQueryLists = breakpoints.map(q =>
    window.matchMedia(`(max-width: ${q})`)
  )

  const getValue = () => {
    const index = mediaQueryLists.findIndex(mql => mql.matches)
    return typeof values[index] !== "undefined" ? values[index] : defaultValue
  }

  const [value, setValue] = React.useState(getValue)

  React.useEffect(() => {
    const handler = () => setValue(getValue)

    mediaQueryLists.forEach(mql => mql.addEventListener("change", handler))

    return () =>
      mediaQueryLists.forEach(mql => mql.removeEventListener("change", handler))
  }, [])

  return value
}
