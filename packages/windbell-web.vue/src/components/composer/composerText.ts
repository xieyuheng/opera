export type CompactMetrics = {
  width: number
  font: string
}

export type TextSelection = {
  start: number
  end: number
}

let measureContext: CanvasRenderingContext2D | null | undefined

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureContext === undefined) {
    measureContext = document.createElement("canvas").getContext("2d")
  }

  return measureContext
}

export function captureCompactMetrics(
  element: HTMLTextAreaElement | null,
): CompactMetrics | null {
  if (element === null) return null

  const style = getComputedStyle(element)
  const horizontalPadding =
    Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
  const width = element.clientWidth - horizontalPadding
  if (!Number.isFinite(width) || width <= 0) return null

  return {
    width,
    font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
  }
}

export function wouldWrapInCompact(
  value: string,
  metrics: CompactMetrics | null,
): boolean {
  if (metrics === null) return false

  const context = getMeasureContext()
  if (context === null) return false

  context.font = metrics.font
  return value
    .split(/\r?\n/)
    .some((line) => context.measureText(line).width > metrics.width + 0.5)
}

export function readSelection(
  element: HTMLTextAreaElement | null,
  fallback: number,
): TextSelection {
  return {
    start: element?.selectionStart ?? fallback,
    end: element?.selectionEnd ?? fallback,
  }
}

export function writeSelection(
  element: HTMLTextAreaElement | null,
  selection: TextSelection,
): void {
  if (element === null) return

  element.focus()
  const max = element.value.length
  element.setSelectionRange(
    Math.min(selection.start, max),
    Math.min(selection.end, max),
  )
}

export function resizeTextarea(element: HTMLTextAreaElement | null): void {
  if (element === null) return

  element.style.height = "auto"
  element.style.height = `${element.scrollHeight}px`
}
