import { Data, Day } from "./index.d"

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

export const formatDateHeading = (date: string): string => {
  const options = {
    weekday: "long",
    year: undefined,
    month: "long",
    day: "numeric"
  }
  return new Date(date).toLocaleDateString(window.navigator.language, options)
}

export const bytesToSize = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  if (bytes == 0) return "0 Byte"

  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))))

  return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i]
}

export const parseDataStr = (data: string): Record<string, unknown> => {
  try {
    return JSON.parse(data)
  } catch (error) {
    return {}
  }
}
