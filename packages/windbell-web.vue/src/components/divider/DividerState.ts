import { reactive } from "vue"

export type DividerState = {
  ratio: number
  minRatio: number
  maxRatio: number
  storageKey: string
}

export type DividerStateOptions = {
  defaultRatio: number
  minRatio: number
  maxRatio: number
  storageKey: string
}

export function makeDividerState(options: DividerStateOptions): DividerState {
  return reactive<DividerState>({
    ratio: readStoredRatio(options),
    minRatio: options.minRatio,
    maxRatio: options.maxRatio,
    storageKey: options.storageKey,
  })
}

export function setDividerRatio(state: DividerState, ratio: number): void {
  state.ratio = clampRatio(ratio, state.minRatio, state.maxRatio)
}

export function commitDividerRatio(state: DividerState): void {
  try {
    localStorage.setItem(state.storageKey, String(state.ratio))
  } catch {
    // ignore storage errors
  }
}

function readStoredRatio(options: DividerStateOptions): number {
  try {
    const stored = localStorage.getItem(options.storageKey)
    if (stored === null) {
      return clampRatio(
        options.defaultRatio,
        options.minRatio,
        options.maxRatio,
      )
    }

    const value = Number(stored)
    if (!Number.isFinite(value)) {
      return clampRatio(
        options.defaultRatio,
        options.minRatio,
        options.maxRatio,
      )
    }

    return clampRatio(value, options.minRatio, options.maxRatio)
  } catch {
    return clampRatio(options.defaultRatio, options.minRatio, options.maxRatio)
  }
}

function clampRatio(value: number, minRatio: number, maxRatio: number): number {
  return Math.min(maxRatio, Math.max(minRatio, value))
}
