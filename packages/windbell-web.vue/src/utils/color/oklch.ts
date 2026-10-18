export type Oklch = {
  l: number
  c: number
  h: number
}

const oklchPattern =
  /^oklch\(\s*([0-9]*\.?[0-9]+)(%?)\s+([0-9]*\.?[0-9]+)(%?)\s+([0-9]*\.?[0-9]+)(?:deg)?\s*\)$/i

export function parseOklch(value: string): Oklch | undefined {
  const match = oklchPattern.exec(value.trim())
  if (match === null) return undefined

  const lText = match[1]
  const lPercent = match[2]
  const cText = match[3]
  const cPercent = match[4]
  const hText = match[5]

  if (lText === undefined || cText === undefined || hText === undefined) {
    return undefined
  }

  const lValue = Number(lText)
  const cValue = Number(cText)
  const hValue = Number(hText)

  if (
    !Number.isFinite(lValue) ||
    !Number.isFinite(cValue) ||
    !Number.isFinite(hValue)
  ) {
    return undefined
  }

  return {
    l: lPercent === "%" ? lValue / 100 : lValue,
    c: cPercent === "%" ? (cValue / 100) * 0.4 : cValue,
    h: normalizeHue(hValue),
  }
}

export function formatOklch(color: Oklch): string {
  return `oklch(${formatNumber(color.l)} ${formatNumber(color.c)} ${formatNumber(color.h, 2)})`
}

export function cssColorToOklch(value: string): Oklch | undefined {
  const parsed = parseOklch(value)
  if (parsed !== undefined) return parsed

  const rgb = cssColorToRgb(value)
  if (rgb === undefined) return undefined

  return srgbToOklch(rgb)
}

export function oklchToCss(color: Oklch): string {
  const rgb = oklchToSrgb(color)
  return formatHex(rgb)
}

function cssColorToRgb(value: string): [number, number, number] | undefined {
  if (typeof CSS === "undefined" || !CSS.supports("color", value)) {
    return undefined
  }

  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (context === null) return undefined

  context.fillStyle = "#000000"
  context.fillStyle = value
  const normalized = context.fillStyle

  if (normalized.startsWith("#")) {
    return parseHex(normalized)
  }

  const match = /^rgba?\(([^)]+)\)$/i.exec(normalized)
  if (match === null || match[1] === undefined) return undefined

  const parts = match[1]
    .split(/[,\s/]+/)
    .map((part) => part.trim())
    .filter((part) => part !== "")

  if (parts.length < 3) return undefined

  const red = Number.parseFloat(parts[0]!)
  const green = Number.parseFloat(parts[1]!)
  const blue = Number.parseFloat(parts[2]!)

  if (
    !Number.isFinite(red) ||
    !Number.isFinite(green) ||
    !Number.isFinite(blue)
  ) {
    return undefined
  }

  return [red / 255, green / 255, blue / 255]
}

function parseHex(value: string): [number, number, number] | undefined {
  const hex = value.slice(1)
  if (hex.length === 3) {
    const red = Number.parseInt(hex[0]! + hex[0]!, 16) / 255
    const green = Number.parseInt(hex[1]! + hex[1]!, 16) / 255
    const blue = Number.parseInt(hex[2]! + hex[2]!, 16) / 255
    return [red, green, blue]
  }

  if (hex.length !== 6) return undefined

  return [
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255,
  ]
}

function srgbToOklch(rgb: [number, number, number]): Oklch {
  const [red, green, blue] = rgb.map(srgbToLinear) as [number, number, number]

  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue

  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)

  const lightness =
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot
  const b = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot

  const chroma = Math.sqrt(a * a + b * b)
  const hue = normalizeHue((Math.atan2(b, a) * 180) / Math.PI)

  return {
    l: clamp(lightness, 0, 1),
    c: Math.max(0, chroma),
    h: hue,
  }
}

function oklchToSrgb(color: Oklch): [number, number, number] {
  const hue = (color.h * Math.PI) / 180
  const a = color.c * Math.cos(hue)
  const b = color.c * Math.sin(hue)

  const lRoot = color.l + 0.3963377774 * a + 0.2158037573 * b
  const mRoot = color.l - 0.1055613458 * a - 0.0638541728 * b
  const sRoot = color.l - 0.0894841775 * a - 1.291485548 * b

  const l = lRoot * lRoot * lRoot
  const m = mRoot * mRoot * mRoot
  const s = sRoot * sRoot * sRoot

  const redLinear = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const greenLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const blueLinear = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  return [
    clamp(linearToSrgb(redLinear), 0, 1),
    clamp(linearToSrgb(greenLinear), 0, 1),
    clamp(linearToSrgb(blueLinear), 0, 1),
  ]
}

function srgbToLinear(value: number): number {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4)
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055
}

function formatHex(rgb: [number, number, number]): string {
  const [red, green, blue] = rgb.map((value) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, "0"),
  ) as [string, string, string]

  return `#${red}${green}${blue}`
}

function formatNumber(value: number, fractionDigits = 4): string {
  return value.toFixed(fractionDigits).replace(/\.?0+$/, "")
}

function normalizeHue(value: number): number {
  const hue = value % 360
  return hue < 0 ? hue + 360 : hue
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
