import type { MarkdownEnvironment } from "@xieyuheng/markdown.vue"
import { reactive } from "vue"

import {
  parseCuration,
  type Curation,
  type CurationNode,
} from "../curation/index.ts"
import { loadDocument } from "./document.ts"

export type MuseumDocumentKind = "none" | "markdown" | "unsupported"

export type MuseumNavColumn = {
  key: "children" | "siblings" | "uncles"
  nodes: Array<CurationNode>
}

export type MuseumState = {
  contentBaseUrl: string
  curationUrl: string
  name: string | undefined

  curation: Curation | undefined
  currentNode: CurationNode | undefined

  documentUrl: string | undefined
  documentKind: MuseumDocumentKind
  documentText: string

  hasLoadedCuration: boolean
  isCurationLoading: boolean
  curationRequestId: number
  curationError: string | undefined

  isDocumentLoading: boolean
  documentRequestId: number
  documentError: string | undefined
}

export function makeMuseumState(
  contentBaseUrl: string,
  name?: string,
): MuseumState {
  const normalizedBaseUrl = normalizeContentBaseUrl(contentBaseUrl)

  const state = reactive<MuseumState>({
    contentBaseUrl: normalizedBaseUrl,
    curationUrl: new URL("curation", normalizedBaseUrl).href,
    name,

    curation: undefined,
    currentNode: undefined,

    documentUrl: undefined,
    documentKind: "none",
    documentText: "",

    hasLoadedCuration: false,
    isCurationLoading: true,
    curationRequestId: 0,
    curationError: undefined,

    isDocumentLoading: false,
    documentRequestId: 0,
    documentError: undefined,
  })

  syncMuseumNode(state)
  return state
}

export function setMuseumContentBaseUrl(
  state: MuseumState,
  contentBaseUrl: string,
): void {
  const normalizedBaseUrl = normalizeContentBaseUrl(contentBaseUrl)

  state.contentBaseUrl = normalizedBaseUrl
  state.curationUrl = new URL("curation", normalizedBaseUrl).href

  state.curation = undefined
  state.currentNode = undefined
  state.hasLoadedCuration = false
  state.curationError = undefined
  state.curationRequestId += 1
  state.isCurationLoading = true

  state.documentRequestId += 1
  state.documentUrl = undefined
  state.documentKind = "none"
  state.documentText = ""
  state.documentError = undefined
  state.isDocumentLoading = false

  syncMuseumNode(state)
}

export function setMuseumName(
  state: MuseumState,
  name: string | undefined,
): void {
  state.name = name
  syncMuseumNode(state)
}

export function syncMuseumNode(state: MuseumState): void {
  const previousDocumentUrl = state.documentUrl

  if (state.curation === undefined || state.name === undefined) {
    state.currentNode = undefined
    state.documentUrl = undefined
    state.documentKind = "none"
  } else {
    state.currentNode = state.curation.byName.get(state.name)
    state.documentUrl =
      state.currentNode === undefined
        ? undefined
        : new URL(state.currentNode.path, state.curationUrl).href
    state.documentKind = documentKindOf(state.documentUrl)
  }

  if (state.documentUrl !== previousDocumentUrl) {
    state.documentRequestId += 1
    state.documentText = ""
    state.documentError = undefined
    state.isDocumentLoading = false
  }
}

export async function loadMuseumCuration(state: MuseumState): Promise<void> {
  const requestId = ++state.curationRequestId
  const curationUrl = state.curationUrl

  state.isCurationLoading = true
  state.curationError = undefined

  try {
    const response = await fetch(curationUrl, { cache: "no-cache" })
    if (!response.ok) {
      throw new Error(
        `failed to fetch curation: ${response.status} ${response.statusText} (${curationUrl})`,
      )
    }

    const text = await response.text()
    if (requestId !== state.curationRequestId) return

    state.curation = parseCuration(text, {
      resolvePath: (path) => new URL(path, curationUrl).href,
    })
    state.hasLoadedCuration = true
    syncMuseumNode(state)
  } catch (error) {
    if (requestId !== state.curationRequestId) return

    state.curation = undefined
    state.hasLoadedCuration = false
    state.curationError = error instanceof Error ? error.message : String(error)
    syncMuseumNode(state)
  } finally {
    if (requestId === state.curationRequestId) {
      state.isCurationLoading = false
    }
  }
}

export async function loadMuseumDocument(state: MuseumState): Promise<void> {
  const requestId = ++state.documentRequestId
  const documentUrl = state.documentUrl

  state.documentError = undefined

  if (documentUrl === undefined || state.documentKind !== "markdown") {
    state.documentText = ""
    state.isDocumentLoading = false
    return
  }

  state.isDocumentLoading = true

  try {
    const text = await loadDocument(new URL(documentUrl))
    if (requestId !== state.documentRequestId) return
    state.documentText = text
  } catch (error) {
    if (requestId !== state.documentRequestId) return
    state.documentText = ""
    state.documentError = error instanceof Error ? error.message : String(error)
  } finally {
    if (requestId === state.documentRequestId) {
      state.isDocumentLoading = false
    }
  }
}

export async function loadMuseumPage(state: MuseumState): Promise<void> {
  if (!state.hasLoadedCuration) {
    await loadMuseumCuration(state)
  }

  syncMuseumNode(state)
  if (state.currentNode !== undefined) {
    await loadMuseumDocument(state)
  }
}

export function isMuseumPageMissing(state: MuseumState): boolean {
  return (
    state.curation !== undefined &&
    state.name !== undefined &&
    state.currentNode === undefined
  )
}

export function museumNavColumns(state: MuseumState): Array<MuseumNavColumn> {
  const current = state.currentNode
  if (current === undefined) return []

  let columns: Array<MuseumNavColumn>

  if (current.parent === undefined) {
    columns = [{ key: "children", nodes: current.children }]
  } else if (current.parent.parent === undefined) {
    columns = [
      { key: "siblings", nodes: current.parent.children },
      { key: "children", nodes: current.children },
    ]
  } else {
    columns = [
      { key: "uncles", nodes: current.parent.parent.children },
      { key: "siblings", nodes: current.parent.children },
      { key: "children", nodes: current.children },
    ]
  }

  return columns.filter((column) => column.nodes.length > 0)
}

export function makeMuseumMarkdownEnvironment(
  state: MuseumState,
  navigate: (name: string) => void,
): MarkdownEnvironment | undefined {
  const curation = state.curation
  const documentUrl = state.documentUrl

  if (curation === undefined || documentUrl === undefined) return undefined

  const byPath = curation.byPath

  function lookup(url: URL): CurationNode | undefined {
    const key = new URL(url.href)
    key.hash = ""
    return byPath.get(key.href)
  }

  return {
    resolveUrl(url) {
      if (
        url.startsWith("#") ||
        url.startsWith("mailto:") ||
        url.startsWith("tel:")
      ) {
        return url
      }

      try {
        return new URL(url, documentUrl).href
      } catch {
        return url
      }
    },

    linkTarget(url) {
      if (url.startsWith("#")) return undefined

      try {
        return lookup(new URL(url, documentUrl)) === undefined
          ? "_blank"
          : undefined
      } catch {
        return "_blank"
      }
    },

    handleLinkClick(event, url) {
      if (url.startsWith("#")) return false

      try {
        const resolved = new URL(url, documentUrl)
        const node = lookup(resolved)
        if (node === undefined) return false

        event.preventDefault()
        navigate(node.name)
        return true
      } catch {
        return false
      }
    },
  }
}

function normalizeContentBaseUrl(value: string): string {
  const base = value.endsWith("/") ? value : `${value}/`
  return new URL(base, window.location.href).href
}

function documentKindOf(documentUrl: string | undefined): MuseumDocumentKind {
  if (documentUrl === undefined) return "none"

  const pathname = new URL(documentUrl).pathname.toLowerCase()
  return pathname.endsWith(".md") ? "markdown" : "unsupported"
}
