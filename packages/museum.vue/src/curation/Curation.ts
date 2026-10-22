export type CurationNode = {
  depth: number
  name: string
  path: string
  parent: CurationNode | undefined
  children: Array<CurationNode>
}

export type Curation = {
  root: CurationNode
  byName: Map<string, CurationNode>
  byPath: Map<string, CurationNode>
}

export class CurationParseError extends Error {
  line: number

  constructor(line: number, message: string) {
    super(`curation:${line}: ${message}`)
    this.name = "CurationParseError"
    this.line = line
  }
}

export type ParseCurationOptions = {
  resolvePath?: (path: string) => string
}

const invalidNameCharacters = /[/?#%]/u

export function parseCuration(
  source: string,
  options: ParseCurationOptions = {},
): Curation {
  const rootCandidates: Array<CurationNode> = []
  const byName = new Map<string, CurationNode>()
  const byPath = new Map<string, CurationNode>()
  const stack: Array<CurationNode> = []

  const lines = source.split(/\r?\n/u)

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1
    const line = lines[index]?.trim() ?? ""

    if (line === "" || line.startsWith("#")) continue

    const match = /^(\d+)\s+(\S+)\s+(\S+)$/u.exec(line)
    if (match === null) {
      throw new CurationParseError(
        lineNumber,
        "expected: <depth> <name> <path>, with no whitespace in name or path",
      )
    }

    const depth = Number(match[1])
    const name = match[2] as string
    const path = match[3] as string

    if (!Number.isSafeInteger(depth) || depth < 0) {
      throw new CurationParseError(lineNumber, `invalid depth: ${match[1]}`)
    }

    if (invalidNameCharacters.test(name)) {
      throw new CurationParseError(
        lineNumber,
        `invalid name: ${JSON.stringify(name)} (must not contain / ? # %)`,
      )
    }

    if (byName.has(name)) {
      throw new CurationParseError(lineNumber, `duplicate name: ${name}`)
    }

    const resolvedPath = options.resolvePath?.(path) ?? path
    if (byPath.has(resolvedPath)) {
      throw new CurationParseError(lineNumber, `duplicate path: ${path}`)
    }

    if (depth === 0) {
      if (rootCandidates.length > 0) {
        throw new CurationParseError(lineNumber, "multiple root nodes")
      }
    } else {
      while (stack.length > depth) stack.pop()

      if (stack.length < depth) {
        throw new CurationParseError(
          lineNumber,
          `depth jumps from ${stack.length - 1} to ${depth}`,
        )
      }
    }

    const parent = depth === 0 ? undefined : stack[depth - 1]
    if (depth > 0 && parent === undefined) {
      throw new CurationParseError(lineNumber, "missing parent node")
    }

    const node: CurationNode = {
      depth,
      name,
      path,
      parent,
      children: [],
    }

    if (depth === 0) {
      rootCandidates.push(node)
    } else {
      parent?.children.push(node)
    }

    stack[depth] = node
    stack.length = depth + 1

    byName.set(name, node)
    byPath.set(resolvedPath, node)
  }

  const root = rootCandidates[0]
  if (root === undefined) {
    throw new CurationParseError(1, "missing root node with depth 0")
  }

  return { root, byName, byPath }
}

export function collectCurationNodes(root: CurationNode): Array<CurationNode> {
  const nodes: Array<CurationNode> = []

  function visit(node: CurationNode): void {
    nodes.push(node)
    for (const child of node.children) visit(child)
  }

  visit(root)
  return nodes
}
