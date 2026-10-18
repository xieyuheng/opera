export type FormatRelativeTimeOptions = {
  locale: string
  now?: number
}

type RelativeTimeUnit = "minute" | "hour" | "day" | "week" | "month" | "year"

const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>()

function getRelativeTimeFormatter(locale: string): Intl.RelativeTimeFormat {
  const existing = relativeTimeFormatters.get(locale)
  if (existing !== undefined) return existing

  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  })
  relativeTimeFormatters.set(locale, formatter)
  return formatter
}

function formatRelativeUnit(
  formatter: Intl.RelativeTimeFormat,
  locale: string,
  value: number,
  unit: RelativeTimeUnit,
): string {
  const text = formatter.format(value, unit)
  if (!locale.startsWith("zh")) return text

  return text.replace(/(\d)(?=[\u4e00-\u9fff])/g, "$1 ")
}

export function formatRelativeTime(
  value: number,
  options: FormatRelativeTimeOptions,
): string {
  const now = options.now ?? Date.now()
  const seconds = Math.max(0, Math.floor((now - value) / 1000))
  const formatter = getRelativeTimeFormatter(options.locale)

  if (seconds < 60) return formatter.format(0, "second")

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return formatRelativeUnit(formatter, options.locale, -minutes, "minute")
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return formatRelativeUnit(formatter, options.locale, -hours, "hour")
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return formatRelativeUnit(formatter, options.locale, -days, "day")
  }

  if (days < 30) {
    const weeks = Math.max(1, Math.floor(days / 7))
    return formatRelativeUnit(formatter, options.locale, -weeks, "week")
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return formatRelativeUnit(formatter, options.locale, -months, "month")
  }

  const years = Math.max(1, Math.floor(months / 12))
  return formatRelativeUnit(formatter, options.locale, -years, "year")
}
