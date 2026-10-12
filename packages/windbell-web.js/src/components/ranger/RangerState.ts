import { makeHttpFileSystemClient } from "@windbell/fs.js/http-fs/client"
import type { FileSystemEntry } from "@windbell/fs.js/fs"
import { reactive } from "vue"
import { isSamePath, parentPath } from "./RangerPath.ts"
import {
  readStoredRangerLocation,
  writeStoredRangerLocation,
} from "./RangerPersistence.ts"

export type RangerFocus = "sidebar" | "view"

export type RangerState = {
  root: string
  locationStorageKey: string
  currentDirectory: string
  entries: Array<FileSystemEntry>
  selectedIndex: number
  selectedEntry: FileSystemEntry | undefined
  focus: RangerFocus
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  error: string | undefined
}

const fs = makeHttpFileSystemClient({
  baseUrl: "/api/fs",
})

export function makeRangerState(
  root: string,
  locationStorageKey: string,
): RangerState {
  return reactive<RangerState>({
    root,
    locationStorageKey,
    currentDirectory: "",
    entries: [],
    selectedIndex: -1,
    selectedEntry: undefined,
    focus: "sidebar",
    hasLoaded: false,
    isLoading: true,
    isPending: false,
    requestId: 0,
    error: undefined,
  })
}

function persistLocation(state: RangerState): void {
  writeStoredRangerLocation(state.locationStorageKey, {
    currentDirectory: state.currentDirectory,
    selectedPath: state.selectedEntry?.path ?? null,
  })
}

export async function loadRanger(state: RangerState): Promise<void> {
  if (state.root === "") {
    state.currentDirectory = ""
    state.entries = []
    state.selectedIndex = -1
    state.selectedEntry = undefined
    state.hasLoaded = false
    state.isLoading = false
    state.isPending = false
    state.error = undefined
    return
  }

  const storedLocation = readStoredRangerLocation(state.locationStorageKey)

  if (storedLocation !== undefined) {
    const restored = await loadDirectory(
      state,
      storedLocation.currentDirectory,
      {
        selectPath: storedLocation.selectedPath ?? undefined,
      },
    )

    if (restored) return
  }

  await loadDirectory(state, state.root)
}

export type LoadDirectoryOptions = {
  selectPath?: string
}

export async function loadDirectory(
  state: RangerState,
  path: string,
  options: LoadDirectoryOptions = {},
): Promise<boolean> {
  const requestId = ++state.requestId

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  state.error = undefined

  try {
    const result = await fs.listEntries(path)

    if (requestId !== state.requestId) return false

    if (result.kind === "ErrorResult") {
      state.error = result.error.message
      return false
    }

    const entries = result.value

    const selectedIndex =
      options.selectPath === undefined
        ? 0
        : entries.findIndex((entry) => entry.path === options.selectPath)
    const index = selectedIndex === -1 ? 0 : selectedIndex

    state.entries = entries
    state.currentDirectory = path
    state.selectedIndex = entries.length > 0 ? index : -1
    state.selectedEntry = entries[index]
    state.hasLoaded = true

    persistLocation(state)
    return true
  } finally {
    if (requestId === state.requestId) {
      state.isLoading = false
      state.isPending = false
    }
  }
}

export async function refreshRanger(state: RangerState): Promise<void> {
  if (state.currentDirectory === "") return

  const directory = state.currentDirectory
  const result = await fs.listEntries(directory)

  if (
    state.isLoading ||
    state.isPending ||
    directory !== state.currentDirectory
  ) {
    return
  }

  if (result.kind === "ErrorResult") {
    if (!isSamePath(directory, state.root)) {
      await loadDirectory(state, state.root)
      return
    }

    state.error = result.error.message
    return
  }

  const entries = result.value
  const selectedPath = state.selectedEntry?.path
  const selectedIndex =
    selectedPath === undefined
      ? -1
      : entries.findIndex((entry) => entry.path === selectedPath)
  const index = selectedIndex === -1 ? 0 : selectedIndex

  state.entries = entries
  state.selectedIndex = entries.length > 0 ? index : -1
  state.selectedEntry = entries[index]
  state.error = undefined

  persistLocation(state)
}

export function watchRanger(
  state: RangerState,
  onError?: (error: Error) => void,
): () => void {
  if (state.root === "") return () => {}

  const controller = new AbortController()
  let refreshTimer: ReturnType<typeof setTimeout> | undefined

  function scheduleRefresh(): void {
    if (refreshTimer !== undefined) {
      clearTimeout(refreshTimer)
    }

    refreshTimer = setTimeout(() => {
      refreshTimer = undefined

      if (!state.isLoading && !state.isPending) {
        void refreshRanger(state)
      }
    }, 150)
  }

  void (async () => {
    for await (const event of fs.watch(state.root, {
      signal: controller.signal,
    })) {
      switch (event.type) {
        case "error":
          state.error = event.error.message
          onError?.(new Error(event.error.message))
          break

        case "ready":
          state.error = undefined
          scheduleRefresh()
          break

        case "change":
          scheduleRefresh()
          break

        case "reconnecting":
        case "ping":
        case "close":
          break
      }
    }
  })()

  return () => {
    if (refreshTimer !== undefined) {
      clearTimeout(refreshTimer)
      refreshTimer = undefined
    }

    controller.abort()
  }
}

export function selectEntry(state: RangerState, index: number): void {
  if (index < 0 || index >= state.entries.length) return

  state.selectedIndex = index
  state.selectedEntry = state.entries[index]

  persistLocation(state)
}

export function moveSelection(state: RangerState, delta: number): void {
  if (state.entries.length === 0) return

  const index = state.selectedIndex + delta
  if (index < 0 || index >= state.entries.length) return

  selectEntry(state, index)
}

export async function openSelectedEntry(state: RangerState): Promise<void> {
  const entry = state.selectedEntry
  if (entry === undefined) return

  if (entry.kind === "Directory") {
    await loadDirectory(state, entry.path)
    return
  }

  state.focus = "view"
}

export async function goParent(state: RangerState): Promise<void> {
  if (isSamePath(state.currentDirectory, state.root)) return

  const previousDirectory = state.currentDirectory

  await loadDirectory(state, parentPath(previousDirectory), {
    selectPath: previousDirectory,
  })
}
