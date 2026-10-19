import type { Definition, FootnoteDefinition, Root } from "mdast"
import type { MarkdownNode } from "./markdownTypes.ts"

export interface MarkdownState {
  definitions: ReadonlyMap<string, Definition>
  footnoteDefinitions: ReadonlyMap<string, FootnoteDefinition>
  footnoteNumbers: ReadonlyMap<string, number>
}

interface MarkdownStateBuilder {
  definitions: Map<string, Definition>
  footnoteDefinitions: Map<string, FootnoteDefinition>
  footnoteNumbers: Map<string, number>
}

function collectState(node: MarkdownNode, state: MarkdownStateBuilder): void {
  switch (node.type) {
    case "definition":
      state.definitions.set(node.identifier, node)
      break
    case "footnoteDefinition":
      state.footnoteDefinitions.set(node.identifier, node)
      break
    case "footnoteReference":
      if (!state.footnoteNumbers.has(node.identifier)) {
        state.footnoteNumbers.set(
          node.identifier,
          state.footnoteNumbers.size + 1,
        )
      }
      break
  }

  if ("children" in node) {
    for (const child of node.children) {
      collectState(child as MarkdownNode, state)
    }
  }
}

export function createMarkdownState(root: Root): MarkdownState {
  const state: MarkdownStateBuilder = {
    definitions: new Map(),
    footnoteDefinitions: new Map(),
    footnoteNumbers: new Map(),
  }

  collectState(root, state)

  return state
}
