export const today = (): Date => {
  return new Date()
}

export const yesterday = (): Date => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d
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
