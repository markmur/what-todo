import { MouseEvent } from "react"
import { Day } from "./index.d"

export function contrastText(hex: string): string {
  const c = hex.replace("#", "")
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

export const today = (): Date => {
  return new Date()
}

export const yesterday = (): Date => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d
}

export const getPastSevenDays = (): Day[] => {
  const todayStr = today().toDateString()

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i + 1)

    const number = d.getDate() // day number
    const str = d.toDateString()

    return {
      date: d,
      isToday: str === todayStr,
      name: str.slice(0, 3),
      number
    }
  }).sort((a, b) => a.number - b.number)
}

export const formatDateHeading = (
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: undefined,
    month: "long",
    day: "numeric"
  }
): string => {
  return new Date(date).toLocaleDateString(window.navigator.language, options)
}

export const parseDataStr = (data: string): Record<string, unknown> => {
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}

export const preventDefault =
  (fn: (event: MouseEvent, ...args: any[]) => any) =>
  (event: MouseEvent, ...args: any[]) => {
    event.preventDefault()
    event.stopPropagation()

    fn(event, ...args)
  }
